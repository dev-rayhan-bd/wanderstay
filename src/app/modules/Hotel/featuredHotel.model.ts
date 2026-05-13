import { Schema, model } from 'mongoose';

const featuredHotelSchema = new Schema({
  hotelId: { type: String, required: true, unique: true }, 
  hotelName: { type: String, required: true },
  cityName: { type: String },
  rating: { type: String },
  image: { type: String }, 
  isFeatured: { type: Boolean, default: true }
}, { timestamps: true });

export const FeaturedHotelModel = model('FeaturedHotel', featuredHotelSchema);