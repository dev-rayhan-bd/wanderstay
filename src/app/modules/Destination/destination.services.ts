import { DestinationModel } from './destination.model';
import { SupplierService } from '../Supplier/supplier.service';
import QueryBuilder from '../../builder/QueryBuilder';


const syncAllDestinationsFromSupplier = async () => {
  const countriesRes = await SupplierService.callWebBeds('getallcountries');
  const countryData = countriesRes.result?.countries?.country;
  if (!countryData) return 0;

  const countries = Array.isArray(countryData) ? countryData : [countryData];
  let totalSynced = 0;

 
  for (const country of countries.slice(0, 10)) {
    const response = await SupplierService.callWebBeds('searchhotels', {
      bookingDetails: {
        fromDate: "2026-12-01", 
        toDate: "2026-12-05", 
        currency: "520",
        rooms: { 
          $: { no: "1" }, 
          room: { $: { runno: "0" }, adultsCode: "1", children: { $: { no: "0" } }, rateBasis: "-1" } 
        }
      },
      return: { 
        filters: { country: country.code, noPrice: "true" }, 
        fields: { field: ["cityName", "cityCode"] } 
      }
    });

    const rawHotels = response.result?.hotels?.hotel;
    if (!rawHotels) continue;

    const hotelList = Array.isArray(rawHotels) ? rawHotels : [rawHotels];
    const cityMap = new Map();

    hotelList.forEach((h: any) => {
      if (h.cityCode && h.cityName) {
        cityMap.set(h.cityCode, { 
          cityCode: h.cityCode, 
          cityName: h.cityName, 
          countryName: country.name 
        });
      }
    });

    if (cityMap.size > 0) {
      const ops = Array.from(cityMap.values()).map(city => ({
        updateOne: { filter: { cityCode: city.cityCode }, update: city, upsert: true }
      }));
      await DestinationModel.bulkWrite(ops);
      totalSynced += cityMap.size;
    }
  }
  return totalSynced;
};


const syncEverythingDynamically = async () => {
  const testCountries = [
    { name: 'United Arab Emirates', code: '215' },
    { name: 'United Kingdom', code: '129' }
  ];

  for (const country of testCountries) {
    const response = await SupplierService.callWebBeds('searchhotels', {
      bookingDetails: {
        fromDate: "2026-12-01", toDate: "2026-12-05", currency: "520",
        rooms: { $: { no: "1" }, room: { $: { runno: "0" }, adultsCode: "1", rateBasis: "-1" } }
      },
      return: { filters: { country: country.code, noPrice: "true" } }
    });
   
  }
};


const searchDestinationsFromDB = async (query: Record<string, unknown>) => {
  const destinationQuery = new QueryBuilder(DestinationModel.find(), query)
    .search(['cityName', 'countryName']) 
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await destinationQuery.modelQuery;
  const meta = await destinationQuery.countTotal();

  return { result, meta };
};

export const DestinationService = { 
  syncAllDestinationsFromSupplier, 
  syncEverythingDynamically, 
  searchDestinationsFromDB 
};