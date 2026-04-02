import { Schema, model } from 'mongoose';

const destinationSchema = new Schema({
  cityCode: { type: String, required: true, unique: true },
  cityName: { type: String, required: true, index: true },
  countryName: { type: String },
}, { timestamps: true });

export const DestinationModel = model('Destination', destinationSchema);