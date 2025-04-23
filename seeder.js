require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker");

const User = require("./models/User");
const Pharmacy = require("./models/medicalTourism/Pharmacy");
const Medication = require("./models/medicalTourism/Medication");
const Laboratory = require("./models/medicalTourism/Laboratory");
const LabService = require("./models/medicalTourism/LabService");
const MedicalTourismPackage = require("./models/medicalTourism/MedicalTourismPackage");
const Brand = require('./models/medicalTourism/Brand');
const Category = require('./models/medicalTourism/Category');

// MongoDB Connection
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
}

// Roles to be created
const roles = [
    "user",
    "specialist",
    "admin",
    "pharmacyAdmin",
    "labAdmin",
    "pharmacyEmployee",
    "labEmployee",
    "consultant",
];

// Generate Random Users for Each Role
const generateUsers = async () => {
    let users = [];
    for (let role of roles) {
        const hashedPassword = await bcrypt.hash("Test1234", 10);
        const user = await User.findOneAndUpdate(
            { role },
            {
                role,
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                email: faker.internet.email(),
                password: hashedPassword,
                phone: faker.phone.number("+1-###-###-####"),
                country: faker.location.country(),
                isEmailVerified: faker.datatype.boolean(),
                isApproved: faker.datatype.boolean(),
            },
            { upsert: true, new: true }
        );
        users.push(user);
    }
    return users;
};

// Generate Categories
const generateCategories = async () => {
    const categories = [
        "Pain Relief",
        "Antibiotics",
        "Vitamins",
        "Allergy",
        "Cold & Flu",
        "Diabetes",
        "Heart Health",
        "Digestive Health"
    ];

    await Category.deleteMany();
    const createdCategories = await Category.insertMany(categories.map(name => ({ name })));
    console.log(`✅ Created ${createdCategories.length} categories.`);
    return createdCategories;
};

const generateBrands = async () => {
    try {
      console.log("🚀 Seeding Brands...");
      const placeholderLogo = "https://placehold.co/400"; // Generic fallback image
  
      const brandData = [
        { name: "Pfizer", description: "Leading pharmaceutical company", logo: placeholderLogo },
        { name: "Johnson & Johnson", description: "Health and wellness products", logo: placeholderLogo },
        { name: "Bayer", description: "German multinational pharmaceutical company", logo: placeholderLogo },
        { name: "GSK", description: "Global healthcare company", logo: placeholderLogo },
        { name: "Novartis", description: "Swiss-based pharmaceutical company", logo: placeholderLogo },
        { name: "Sanofi", description: "French multinational healthcare company", logo: placeholderLogo },
        { name: "Merck", description: "Science and technology company", logo: placeholderLogo },
        { name: "AstraZeneca", description: "British-Swedish biopharmaceutical company", logo: placeholderLogo }
      ];
  
      await Brand.deleteMany();
      console.log("🗑️ Cleared existing brands");
  
      const createdBrands = await Brand.insertMany(brandData);
      console.log(`✅ Created ${createdBrands.length} brands.`);
      return createdBrands; // ✅ Return the brands
    } catch (error) {
      console.error("❌ Error seeding brands:", error);
      process.exit(1);
    }
};
  


// Generate Pharmacy
const generatePharmacy = async (adminUser) => {
    if (!adminUser) throw new Error("❌ Pharmacy Admin not found!");
    return Pharmacy.findOneAndUpdate(
        { pharmacyAdmin: adminUser._id },
        {
            name: faker.company.name() + " Pharmacy",
            license: faker.string.alphanumeric(10).toUpperCase(),
            pharmacyAdmin: adminUser._id,
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                country: faker.location.country(),
            },
            contactNumber: faker.phone.number("+1-###-###-####"),
            status: "active",
        },
        { upsert: true, new: true }
    );
};

// Generate Laboratory
const generateLaboratory = async (adminUser) => {
    if (!adminUser) throw new Error("❌ Lab Admin not found!");
    return Laboratory.findOneAndUpdate(
        { labAdmin: adminUser._id },
        {
            name: faker.company.name() + " Lab",
            license: faker.string.alphanumeric(10).toUpperCase(),
            labAdmin: adminUser._id,
            address: {
                street: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                country: faker.location.country(),
            },
            contactNumber: faker.phone.number("+1-###-###-####"),
            status: "active",
        },
        { upsert: true, new: true }
    );
};

// Generate Medications
const generateMedications = async (pharmacy, categoryIds, brandIds, count) => {
    if (!pharmacy) throw new Error("❌ Pharmacy not found!");
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) throw new Error("❌ Category IDs are required!");
    if (!Array.isArray(brandIds) || brandIds.length === 0) throw new Error("❌ Brand IDs are required!");

    let medications = [];
    for (let i = 0; i < count; i++) {
        medications.push({
            name: faker.commerce.productName(),
            description: faker.commerce.productDescription(),
            price: faker.number.float({ min: 5, max: 100, precision: 0.01 }),
            prescriptionRequired: faker.datatype.boolean(),
            pharmacy: pharmacy._id,
            stock: faker.number.int({ min: 10, max: 500 }),
            status: faker.helpers.arrayElement(["available", "out of stock"]),
            photo: faker.image.urlPicsumPhotos(),
            brand: faker.helpers.arrayElement(brandIds),
            category: faker.helpers.arrayElement(categoryIds),
        });
    }
    return Medication.insertMany(medications);
};

// Generate Lab Services
const generateLabServices = async (laboratory, count) => {
    if (!laboratory) throw new Error("❌ Laboratory not found!");

    let services = [];
    for (let i = 0; i < count; i++) {
        services.push({
            name: faker.commerce.productName() + " Test",
            description: faker.lorem.sentence(),
            price: faker.number.float({ min: 50, max: 500, precision: 0.01 }),
            laboratory: laboratory._id,
            status: faker.helpers.arrayElement(["available", "unavailable"]),
        });
    }
    return LabService.insertMany(services);
};

// Generate Medical Tourism Packages
const generateMedicalTourismPackages = async (count) => {
    let packages = [];
    for (let i = 0; i < count; i++) {
        packages.push({
            name: faker.commerce.productName() + " Package",
            description: faker.lorem.paragraph(),
            price: faker.number.float({ min: 500, max: 5000, precision: 0.01 }),
            location: faker.location.city() + ", " + faker.location.country(),
            duration: faker.number.int({ min: 3, max: 14 }) + " days",
            services: [faker.commerce.product(), faker.commerce.product(), faker.commerce.product()],
            status: faker.helpers.arrayElement(["available", "unavailable"]),
            photo: faker.image.urlPicsumPhotos(),
        });
    }
    return MedicalTourismPackage.insertMany(packages);
};

// Seed Database (Refreshing Only Medications, Pharmacies, and Labs)
async function seedDatabase() {
    try {
        console.log("🚀 Seeding Started...");
        await connectDB();

        // Fetch existing users for pharmacy/lab admins
        const users = await generateUsers();
        console.log(`✅ Created/Updated ${users.length} users.`);

        const pharmacyAdmin = users.find(user => user.role === "pharmacyAdmin");
        const labAdmin = users.find(user => user.role === "labAdmin");

        // Fetch existing categories and brands (no need to delete them)
        const categories = await generateCategories();
        const brands = await generateBrands();

        // ❗ Refresh Pharmacies and Labs Only
        await Pharmacy.deleteMany();
        await Laboratory.deleteMany();
        console.log("♻️ Cleared existing Pharmacies and Laboratories.");

        const pharmacy = await generatePharmacy(pharmacyAdmin);
        console.log(`✅ Created/Updated Pharmacy: ${pharmacy.name}`);

        const laboratory = await generateLaboratory(labAdmin);
        console.log(`✅ Created/Updated Laboratory: ${laboratory.name}`);

        // ❗ Refresh Medications Only
        await Medication.deleteMany();
        console.log("♻️ Cleared existing Medications.");

        // ✅ Ensure they exist before using .map()
        if (!categories || categories.length === 0) throw new Error("❌ No categories found!");
        if (!brands || brands.length === 0) throw new Error("❌ No brands found!");

        // Now this will work fine
        await generateMedications(pharmacy, categories.map(c => c._id), brands.map(b => b._id), 10);
        console.log(`✅ Created 10 new medications.`);

        // ❗ Refresh Lab Services Only
        await LabService.deleteMany();
        console.log("♻️ Cleared existing Lab Services.");

        const labServices = await generateLabServices(laboratory, 5);
        console.log(`✅ Created ${labServices.length} new lab services.`);

        const medicalTourismPackages = await generateMedicalTourismPackages(10);
        console.log(`✅ Created ${medicalTourismPackages.length} new Medical Tourism Packages.`);

        console.log("🎉 Seeding Completed Successfully!");
    } catch (error) {
        console.error("❌ Error Seeding Database:", error);
    } finally {
        mongoose.connection.close();
    }
}


// Run Seeding
seedDatabase();
