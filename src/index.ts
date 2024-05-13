import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express, { Request, Response } from "express";
import { router } from "./routes/router.js";

// import prisma from "./db/index.js";
// import station_data from "./controllers/export.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: ["https://evcharge-theta.vercel.app", "http://localhost:5173"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

// async function seedData() {
//     const gasStations = station_data;

//     try {
//         await prisma.station.createMany({
//             data: gasStations.map((station) => ({
//                 stationName: station.Station_Name,
//                 stationAddress: station.Station_address,
//                 latitude: parseFloat(station.Latitude),
//                 longitude: parseFloat(station.Longitude),
//                 category: "Ev",
//             })),
//         });
//         console.log("Data seeded successfully.");
//     } catch (error) {
//         console.error("Error seeding data:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// async function seedData() {
//     const gasStations = station_data;

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

//Routes
app.use("/api/v1", router);
app.use("/api/v1/health", (req: Request, res: Response) => {
    res.status(200).json({ message: "Server is running" });
});

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
