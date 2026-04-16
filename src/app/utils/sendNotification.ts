// src/app/utils/sendNotification.ts

export const sendNotificationToAdmins = async (title: string, body: string, type: string) => {
  try {
    console.log(`Notification to Admin: ${title} - ${body}`);
   
    return true;
  } catch (error) {
    console.error("Notification Error:", error);
  }
};