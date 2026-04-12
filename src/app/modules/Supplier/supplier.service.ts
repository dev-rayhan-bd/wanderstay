import axios from 'axios';
import config from '../../config';
import { jsonToXml, xmlToJson } from '../../utils/xmlParser';

// const callWebBeds = async (requestCommand: string, details: any = {}) => {
//   const payload: any = {
//     customer: {
//       username: config.dotw.username,
//       password: config.dotw.password,
//       id: config.dotw.id,
//       source: "1",
//       product: "hotel",
//       language: "en",
//       request: {
//         $: { command: requestCommand },
//       }
//     }
//   };

//   // যদি রিকোয়েস্টে bookingDetails বা return থাকে তবেই অ্যাড হবে
//   if (details.bookingDetails) payload.customer.request.bookingDetails = details.bookingDetails;
//   if (details.return) payload.customer.request.return = details.return;

//   const xmlRequest = jsonToXml(payload);
// src/app/modules/Supplier/supplier.service.ts

const callWebBeds = async (requestCommand: string, details: any) => {
  const payload = {
    customer: {
      username: config.dotw.username,
      password: config.dotw.password,
      id: config.dotw.id,
      source: "1",
      product: "hotel",
      language: "en",
      request: {
        $: { command: requestCommand },
        // এখানে শুধু যা পাঠাবো তাই যাবে
        ...details 
      }
    }
  };

  const xmlRequest = jsonToXml(payload);

  try {
    const { data } = await axios.post(config.dotw.url as string, xmlRequest, {
      headers: { 'Content-Type': 'text/xml' }
    });
    return await xmlToJson(data);
  } catch (error: any) {
    throw new Error('Supplier API connection failed');
  }
};

export const SupplierService = { callWebBeds };