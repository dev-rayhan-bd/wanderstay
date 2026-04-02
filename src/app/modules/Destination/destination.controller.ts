import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { SupplierService } from '../Supplier/supplier.service';
import { DestinationModel } from './destination.model';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';
const syncAllDestinations = catchAsync(async (req: Request, res: Response) => {
  // ১. সাপ্লায়ার থেকে সব দেশের লিস্ট আনা (এটা কাজ করছে আপনার স্ক্রিনশট অনুযায়ী)
  const countriesRes = await SupplierService.callWebBeds('getallcountries');
  const countryData = countriesRes.result?.countries?.country || [];
  const countries = Array.isArray(countryData) ? countryData : [countryData];

  console.log(`Found ${countries.length} countries. Starting city sync...`);

  let totalSynced = 0;
  
  // টেস্ট করার জন্য আমরা প্রথম ৫-১০ টি দেশের লুপ চালাবো
  // যদি সব দেশের ডাটা চান তবে countries.slice(0, 10) এর বদলে শুধু countries দিন
  for (const country of countries.slice(0, 10)) { 
    console.log(`Syncing cities for: ${country.name} (ID: ${country.code})`);

    const staticRequest = {
      bookingDetails: {
        fromDate: "2026-12-01", // ভবিষ্যতের তারিখ
        toDate: "2026-12-05",
        currency: "520",
        rooms: { $: { no: "1" }, room: { $: { runno: "0" }, adultsCode: "1", children: { $: { no: "0" } }, rateBasis: "-1" } }
      },
      return: {
        filters: { country: country.code, noPrice: "true" },
        fields: { field: ["cityName", "cityCode", "countryName"] }
      }
    };

    const response = await SupplierService.callWebBeds('searchhotels', staticRequest);
    
    // DOTW রেসপন্স চেক (hotels -> hotel)
    const rawHotels = response.result?.hotels?.hotel;
    if (!rawHotels) continue;

    const hotelList = Array.isArray(rawHotels) ? rawHotels : [rawHotels];

    // হোটেল লিস্ট থেকে ইউনিক সিটি কোডগুলো বের করা
    const cityMap = new Map();
    hotelList.forEach((h: any) => {
      if (h.cityCode && h.cityName) {
        cityMap.set(h.cityCode, {
          cityCode: h.cityCode,
          cityName: h.cityName,
          countryName: h.countryName || country.name
        });
      }
    });

    if (cityMap.size > 0) {
      const ops = Array.from(cityMap.values()).map((city) => ({
        updateOne: {
          filter: { cityCode: city.cityCode },
          update: city,
          upsert: true
        }
      }));
      await DestinationModel.bulkWrite(ops);
      totalSynced += cityMap.size;
      console.log(`- Added ${cityMap.size} cities from ${country.name}`);
    }
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Master Sync Finished! Total ${totalSynced} unique cities saved.`,
    data: null
  });
});

// ২. ড্রপডাউনের জন্য সার্চ এপিআই (এটি ফ্রন্টএন্ডে ব্যবহার হবে)
const searchCities = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query; // কাস্টমার যা টাইপ করবে
  const result = await DestinationModel.find({
    cityName: { $regex: q as string, $options: 'i' }
  }).limit(10);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Cities fetched",
    data: result
  });
});
// const syncEverythingDynamically = async () => {
//   // ১. সাপ্লায়ার থেকে ডাইনামিকালি সব দেশের লিস্ট নিয়ে আসা
//   const countriesRes = await SupplierService.callWebBeds('getallcountries');
//   const countries = countriesRes.result?.countries?.country || [];

//   console.log(`Starting sync for ${countries.length} countries...`);

//   for (const country of countries) {
//     // ২. প্রতিটি দেশের আইডি ব্যবহার করে ওই দেশের শহরগুলো আনা
//     const citiesRes = await SupplierService.callWebBeds('searchhotels', {
//       return: {
//         filters: { country: country.code, noPrice: "true" },
//         fields: { field: ["cityName", "cityCode", "countryName"] }
//       }
//     });

//     const rawHotels = citiesRes.result?.hotels?.hotel;
//     if (!rawHotels) continue;

//     const hotelList = Array.isArray(rawHotels) ? rawHotels : [rawHotels];

//     // ৩. মঙ্গোডিবি-তে সেভ করা
//     const ops = hotelList.map((h: any) => ({
//       updateOne: {
//         filter: { cityCode: h.cityCode },
//         update: { 
//           cityCode: h.cityCode, 
//           cityName: h.cityName, 
//           countryName: h.countryName || country.name 
//         },
//         upsert: true
//       }
//     }));

//     if (ops.length > 0) {
//       await DestinationModel.bulkWrite(ops);
//       console.log(`Synced ${ops.length} cities for ${country.name}`);
//     }

//     // লাইভ প্রজেক্টে সাপ্লায়ারের সার্ভারে চাপ কমাতে ২ সেকেন্ড গ্যাপ দেওয়া (Rate Limiting)
//     await new Promise(resolve => setTimeout(resolve, 2000));
//   }
// };
// destination.service.ts

export const syncEverythingDynamically = async () => {
  try {
 
    const countries = [
      { name: 'United Arab Emirates', code: '215' },
      { name: 'United Kingdom', code: '129' }
    ];

    console.log(`Starting sync for ${countries.length} test countries...`);

    for (const country of countries) {
      console.log(`📡 Fetching cities for: ${country.name}...`);

      const citiesRes = await SupplierService.callWebBeds('searchhotels', {
        bookingDetails: {
          fromDate: "2026-12-01", 
          toDate: "2026-12-05",
          currency: "520",
          rooms: { $: { no: "1" }, room: { $: { runno: "0" }, adultsCode: "1", children: { $: { no: "0" } }, rateBasis: "-1" } }
        },
        return: {
          filters: { country: country.code, noPrice: "true" },
          fields: { field: ["cityName", "cityCode", "countryName"] }
        }
      });

      const rawHotels = citiesRes.result?.hotels?.hotel;
      if (!rawHotels) {
        console.log(`⚠️ No data found for ${country.name}`);
        continue;
      }

      const hotelList = Array.isArray(rawHotels) ? rawHotels : [rawHotels];

     
      const cityMap = new Map();
      hotelList.forEach((h: any) => {
        if (h.cityCode && h.cityName) {
          cityMap.set(h.cityCode, {
            cityCode: h.cityCode,
            cityName: h.cityName,
            countryName: h.countryName || country.name
          });
        }
      });

      if (cityMap.size > 0) {
        const ops = Array.from(cityMap.values()).map((city) => ({
          updateOne: {
            filter: { cityCode: city.cityCode },
            update: city,
            upsert: true
          }
        }));
        await DestinationModel.bulkWrite(ops);
        console.log(`✅ Successfully added ${cityMap.size} cities from ${country.name}`);
      }
    }
    console.log('🚀 Initial sync finished!');
  } catch (error: any) {
    console.error('❌ Sync Error:', error.message);
  }
};




const searchDestinations = catchAsync(async (req: Request, res: Response) => {
  const { q } = req.query; 

  const query: any = {};
  if (q) {
    query.cityName = { $regex: q as string, $options: 'i' };
  }

  const result = await DestinationModel.find(query).limit(10); // সেরা ১০টি সাজেশন দেখাবে

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Destinations fetched successfully",
    data: result
  });
});




export const DestinationControllers = { syncAllDestinations, searchCities, syncEverythingDynamically, searchDestinations };