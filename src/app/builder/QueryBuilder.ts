import { Query } from 'mongoose';
import mongoose from 'mongoose'; 
class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const search = this?.query?.search as string;
    if (search) {
      this.modelQuery = this.modelQuery.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: search, $options: 'i' },
        })),
      } as any) as unknown as Query<T[], T>;
    }
    return this;
  }





filter() {
  const queryObj: Record<string, unknown> = { ...this.query };
  const exclude = ['search', 'sort', 'limit', 'page', 'fields'];
  exclude.forEach((k) => delete queryObj[k]);

  const mongo: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(queryObj)) {
    if (raw == null || (typeof raw === 'string' && raw.trim() === '')) continue;

    if (typeof raw === 'object' && !Array.isArray(raw)) {
      mongo[key] = raw;
      continue;
    }

    if (typeof raw === 'string' && mongoose.Types.ObjectId.isValid(raw)) {
      mongo[key] = raw;
      continue;
    }

    if (typeof raw === 'string') {
      if (/^(true|false)$/i.test(raw)) {
        mongo[key] = /^true$/i.test(raw);
        continue;
      }
      mongo[key] = {
        $regex: raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
    } else {
      mongo[key] = raw;
    }
  }

  this.modelQuery = this.modelQuery.find(mongo as any);  
  return this;
}






// sort(field: string = 'createdAt', order: 1 | -1 = -1) {
//   // Handle case where sort could be string or string[]
//   let sortQuery = this.query?.sort;
//   if (Array.isArray(sortQuery)) {
//     sortQuery = sortQuery[0]; // Take first value if array
//   }
  
//   let sortField: string | { [key: string]: 1 | -1 } = sortQuery as string || `${field}`;

//   if (this.query?.price) {
//     const priceSort = (Array.isArray(this.query.price) ? this.query.price[0] : this.query.price) === 'asc' ? 1 : -1;
//     sortField = { price: priceSort };
//   } else {
//     sortField = { [field]: order };
//   }

//   this.modelQuery = this.modelQuery.sort(sortField);
//   return this;
// }
// src/app/builder/QueryBuilder.ts

sort(field: string = 'createdAt', order: 1 | -1 = -1) {
  let sortQuery = this.query?.sort as string;
  
  if (Array.isArray(sortQuery)) {
    sortQuery = sortQuery[0];
  }

  let sortField: any;


  if (sortQuery) {
    sortField = sortQuery;
  } 

  else if (this.query?.price) {
    const priceSort = (Array.isArray(this.query.price) ? this.query.price[0] : this.query.price) === 'asc' ? 1 : -1;
    sortField = { price: priceSort };
  } 

  else {

    sortField = field.startsWith('-') ? field : { [field]: order };
  }

  this.modelQuery = this.modelQuery.sort(sortField);
  return this;
}
  paginate() {
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  fields() {

    const fields =
      (this.query?.fields as string)?.split(',')?.join(' ') || '-__v';
  const mongo: Record<string, unknown> = {};
      
  this.modelQuery = this.modelQuery.find(mongo as any) as unknown as Query<T[], T>;  
    return this;
  }

  async countTotal() {
    const totalQueries = this.modelQuery.getFilter();
    const total = await this.modelQuery.model.countDocuments(totalQueries);
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;