import config from '../config';
import { USER_ROLE } from '../modules/Auth/auth.constant';
import { UserModel } from '../modules/User/user.model';

const superUser = {
  firstName: 'WanderStay',
  lastName: 'SuperAdmin',
  email: config.super_admin_email,
  password: config.super_admin_password,
  contact: config.super_admin_contact || '0000000000',
  location: 'Global',
  dob: new Date('1990-01-01'),
  fcmToken: 'seed-token',
  role: USER_ROLE.superAdmin,
  status: 'in-progress',
  isOtpVerified: true,
  canClaimBirthdayReward: false
};

export const seedSuperAdmin = async () => {
  try {
  
    const isSuperAdminExists = await UserModel.findOne({ role: USER_ROLE.superAdmin });

    if (!isSuperAdminExists) {
    
      await UserModel.create(superUser);
      console.log('✅ Super Admin seeded successfully!');
    } else {
      console.log('ℹ️ Super Admin already exists. Skipping seed.');
    }
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error);
  }
};