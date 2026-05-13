import { Schema, model } from 'mongoose';
import { TDestination } from './destination.interface';

const destinationSchema = new Schema<TDestination>({
  cityCode: { type: String, required: true, unique: true },
  cityName: { type: String, required: true, index: true },
   isPopular: { type: Boolean, default: false }, 
  countryName: { type: String, required: true },
}, { timestamps: true });

export const DestinationModel = model<TDestination>('Destination', destinationSchema);