const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Category = require('../models/Category');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const categories = [
  {
    name: "ID Card",
    icon: "badge",
    description: "NIC, Passport, Driving License"
  },
  {
    name: "Phone",
    icon: "smartphone",
    description: "Mobile phones and accessories"
  },
  {
    name: "Wallet",
    icon: "account-balance-wallet",
    description: "Wallets, purses, card holders"
  },
  {
    name: "Bag",
    icon: "backpack",
    description: "School bags, handbags, luggage"
  },
  {
    name: "Keys",
    icon: "key",
    description: "House, vehicle, office keys"
  },
  {
    name: "Pet",
    icon: "pets",
    description: "Lost or found animals"
  },
  {
    name: "Electronics",
    icon: "devices",
    description: "Laptops, tablets, headphones"
  },
  {
    name: "Documents",
    icon: "description",
    description: "Certificates and important documents"
  },
  {
    name: "Jewelry",
    icon: "diamond",
    description: "Rings, necklaces, bracelets"
  },
  {
    name: "Other",
    icon: "category",
    description: "Items not covered above"
  }
];

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGO_DB_NAME || 'lost2found',
    });
    console.log(`MongoDB Connected: ${conn.connection.host} [${conn.connection.name}]`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();
    
    // Check if categories already exist
    const count = await Category.countDocuments();
    if (count > 0) {
      console.log('Categories already seeded!');
      process.exit();
    }

    await Category.insertMany(categories);
    console.log('Categories Imported successfully!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

importData();
