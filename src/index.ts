import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import http from "http";
import express, { Request, Response } from "express";
import { router } from "./routes/router.js";
import { Server } from "socket.io";

import prisma from "./db/index.js";
// import station_data from "./controllers/export.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["https://evpointer.vercel.app", "http://localhost:5173", "*"],
        methods: ["GET", "POST"],
        credentials: true,
    },
});
//

interface SocketIdToEmailMap {
    [key: string]: string;
}

const socketIdToEmailMap: SocketIdToEmailMap = {};
let users = 0;
io.on("connection", (socket) => {
    console.log("A user connected");
    users++;
    io.emit("user count", users);

    // When a user sends their email
    socket.on("user email", (email) => {
        console.log(`Received email ${email} from socket ${socket.id}`);
        socketIdToEmailMap[socket.id] = email;

        // Emit the socket ID and email back to the client
        io.to(socket.id).emit("socketId", { email, socketId: socket.id });
    });

    // When a user disconnects
    socket.on("disconnect", () => {
        users--;
        io.emit("user count", users);
        console.log(`User ${socketIdToEmailMap[socket.id]} disconnected`);
        delete socketIdToEmailMap[socket.id];
    });

    // When a user sends a message
    socket.on("chat message", (data) => {
        const email = socketIdToEmailMap[socket.id];
        console.log(`Message from ${email}: ${data.message}`);

        // Broadcast the message to all connected clients
        io.emit("chat message", { email, message: data.message });
    });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    cors({
        origin: ["https://evpointer.vercel.app", "http://localhost:5173", "*"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    })
);

// async function seedData() {
//     const gasStations = station_data;
//     const batchsize = 7;
//     const tatoal_tupples = 770;

//     try {
//         for (let i = 0; i < tatoal_tupples; i += batchsize) {
//             const insertedtupple = [];

//             for (let j = 0; j < batchsize; j++) {
//                 const tupple = {
//                     stationName: station_data[j].Station_Name,
//                     stationAddress: station_data[j].Station_address,
//                     latitude: parseFloat(station_data[j].Latitude),
//                     longitude: parseFloat(station_data[j].Longitude),
//                     category: "cng",
//                     rating: 0,
//                     type: "cng",
//                     state: station_data[j]?.State || "",
//                     city: station_data[j]?.City || "",
//                     country: station_data[j]?.Country || "",
//                     stationPhone: station_data[j].Station_Phone,
//                     cardsaccepted: station_data[j].Cards_Accepted || "",
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
// seedData();

// async function seedData() {
//     const gasStations = station_data;

//     try {
//         await prisma.station.createMany({
//             data: station_data.map((station_data) => ({
//                 stationName: station_data.Station_Name,
//                 stationAddress: station_data.Station_address,
//                 latitude: parseFloat(station_data.Latitude),
//                 longitude: parseFloat(station_data.Longitude),
//                 category: "cng",
//                 rating: 0,
//                 type: "cng",
//                 state: station_data?.State || "",
//                 city: station_data?.City || "",
//                 country: station_data?.Country || "",
//                 stationPhone: station_data.Station_Phone,
//                 cardsaccepted: station_data.Cards_Accepted || "",
//                 EVConnectorTypes: station_data.EV_Connector_Types,
//                 opendate: station_data.Open_Date,
//                 zipcode: station_data.ZIP,
//                 website: station_data.EV_Network_Web,
//                 openTime: station_data.Access_Days_Time,
//             })),
//             // skipDuplicates: true,
//         });
//         console.log("Data seeded successfully.");
//     } catch (error) {
//         console.error("Error seeding data:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }
// seedData();

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

// async function updateAllStationTypes() {
//     try {
//         const result = await prisma.station.updateMany({
//             data: {
//                 type: "ev",
//             },
//         });
//         console.log(`${result.count} stations were updated.`);
//     } catch (error) {
//         console.error("Error updating station types:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// }

// updateAllStationTypes();

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
//                 type: station.type,
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
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
