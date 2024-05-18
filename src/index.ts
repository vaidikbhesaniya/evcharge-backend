import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";
import { router } from "./routes/router.js";

import prisma from "./db/index.js";
// import station_data from "./controllers/export.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: ["https://evpointer.vercel.app", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

// async function seedData() {
//     const gasStations = station_data;
//     const batchsize = 2000;
//     const tatoal_tupples = 80000;

//     try {
//         for (let i = 0; i < tatoal_tupples; i += batchsize) {
//             const insertedtupple = [];

//             for (let j = 0; j < batchsize; j++) {
//                 const tupple = {
//                     stationName: station_data[j].Station_Name,
//                     stationAddress: station_data[j].Station_address,
//                     latitude: parseFloat(station_data[j].Latitude),
//                     longitude: parseFloat(station_data[j].Longitude),
//                     category: "Ev",
//                     rating: "",
//                     state: station_data[j]?.State || "",
//                     city: station_data[j]?.City || "",
//                     country: station_data[j]?.Country || "",
//                     stationphone: station_data[j].Station_Phone,
//                     cardaccepted: station_data[j].Cards_Accepted || "",
//                     EVConnectorTypes: station_data[j].EV_Connector_Types,
//                     opendate: station_data[j].Open_Date,
//                     zipcode: station_data[j].ZIP,
//                     website: station_data[j].EV_Network_Web,
//                     openTime: station_data[j].Access_Days_Time,
//                 };

//                 insertedtupple.push(tupple);
//             }

//             await prisma.station.createMany({
//                 data: insertedtupple,
//                 skipDuplicates: true,
//             });
//         }

//         console.log("Data seeded successfully.");
//     } catch (error) {
//         console.error("Error seeding data:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// async function seedData() {
//     // const gasStations = station_data;

//     try {
//         // await prisma.station.createMany({
//         //     data: gasStations.map((station) => ({
//         //         stationName: station.stationName,
//         //         stationAddress: station.stationAddress,
//         //         latitude: parseFloat(station.latitude),
//         //         longitude: parseFloat(station.longitude),
//         //         category: "Ev",
//         //     })),
//         // });
//         await prisma.station.deleteMany();
//         console.log("Data seeded successfully.");
//     } catch (error) {
//         console.error("Error seeding data:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// seedData();

// async function retrieveDataInChunks() {
//     let offset = 0;
//     const batchSize = 1000; // Adjust batch size as per your requirement

//     while (true) {
//         const chunk = await prisma.station.findMany({
//             skip: offset,
//             take: batchSize,
//         });

//         // Process the chunk of data here

//         if (chunk.length < batchSize) {
//             break; // Exit loop if the last chunk is retrieved
//         }

//         offset += batchSize;
//     }
// }

// retrieveDataInChunks();

// async function removeDuplicateStations() {
//     try {
//         const stations = await prisma.station.findMany();
//         const uniqueStations: typeof stations = [];
//         const seenCoordinates = new Set();

//         stations.forEach((station) => {
//             const { latitude, longitude } = station;
//             const coordKey = `${latitude},${longitude}`;

//             if (!seenCoordinates.has(coordKey)) {
//                 seenCoordinates.add(coordKey);
//                 uniqueStations.push(station);
//             }
//         });

//         // Clear the station table and insert unique stations
//         await prisma.station.deleteMany();
//         await prisma.station.createMany({
//             data: uniqueStations.map((station) => ({
//                 stationName: station.stationName,
//                 stationAddress: station.stationAddress,
//                 latitude: station.latitude,
//                 longitude: station.longitude,
//                 category: station.category,
//                 rating: station.rating,
//                 state: station.state,
//                 city: station.city,
//                 country: station.country,
//                 stationPhone: station.stationPhone,
//                 cardsaccepted: station.cardsaccepted,
//                 EVConnectorTypes: station.EVConnectorTypes,
//                 opendate: station.opendate,
//                 zipcode: station.zipcode,
//                 website: station.website,
//                 openTime: station.openTime,
//             })),
//         });

//         console.log("Duplicate stations removed successfully.");
//     } catch (error) {
//         console.error("Error removing duplicate stations:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }
// removeDuplicateStations();

app.get("/station/:offset", async (req, res) => {
    try {
        let offset = parseInt(req.params.offset, 10);
        const batchSize = 1000; // Adjust batch size as per your requirement

        const chunk = await prisma.station.findMany({
            skip: offset,
            take: batchSize,
        });

        // Process the chunk of data here
        res.status(200).json(chunk);
    } catch (error) {
        console.log(error);
    }
});

app.get("/stationall", async (req, res) => {
    try {
        const count = await prisma.station.findMany();
        res.status(200).json(count);
    } catch (error) {
        console.log(error);
    }
});
//Routes
app.use("/api/v1", router);
app.use("/api/v1/health", (req: Request, res: Response) => {
    res.status(200).json({ message: "Server is running" });
});

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
