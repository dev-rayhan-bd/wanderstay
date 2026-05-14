import { Schema, model } from 'mongoose';
import { TFeaturedHotel } from './hotel.interface';

const featuredHotelSchema = new Schema<TFeaturedHotel>({
  hotelId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  cityName: { type: String, required: true },
  location: { type: String },
  description: { type: String },
  price: { type: String },
  image: { type: String },
  rating: { type: String },
  propertyType: { type: String, default: "Hotel" },
  isFeatured: { type: Boolean, default: true }
}, { timestamps: true });

export const FeaturedHotelModel = model<TFeaturedHotel>('FeaturedHotel', featuredHotelSchema);