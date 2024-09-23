// File: app/api/check-trial/route.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Fungsi untuk mengonversi UTC ke WIB (GMT+7)
function convertToWIB(date) {
    const localDate = new Date(date);
    // Menambahkan 7 jam ke waktu UTC untuk mendapatkan WIB
    localDate.setHours(localDate.getHours() + 7);
    return localDate;
}

export async function POST(req) {
    const { deviceId } = await req.json();

    if (!deviceId) {
        return new Response(JSON.stringify({ message: 'Device ID is required' }), { status: 400 });
    }

    try {
        const trial = await prisma.trial.findUnique({
            where: { deviceId },
        });

        let currentDate = new Date();  // Ambil waktu saat ini dalam UTC
        currentDate = convertToWIB(currentDate);  // Konversi currentDate ke WIB

        if (trial) {
            // Konversi waktu trial ke WIB
            const startDateLocal = convertToWIB(trial.startDate);
            const endDateLocal = convertToWIB(trial.endDate);

            // Mengecek apakah trial masih dalam waktu active
            if (currentDate >= startDateLocal && currentDate <= endDateLocal) {
                return new Response(JSON.stringify({ 
                    message: 'Trial is active', 
                    status: 'active', 
                    trial: {
                        ...trial,
                        startDate: startDateLocal,
                        endDate: endDateLocal
                    } 
                }), { status: 200 });
            } else {
                return new Response(JSON.stringify({ 
                    message: 'Trial expired', 
                    status: 'expired', 
                    trial: {
                        ...trial,
                        startDate: startDateLocal,
                        endDate: endDateLocal
                    } 
                }), { status: 200 });
            }
        } else {
            // Jika trial belum ada, buat trial baru (misalnya 10 menit)
            const trialDurationInMinutes = 10;
            const newTrial = await prisma.trial.create({
                data: {
                    deviceId,
                    startDate: currentDate,  // Simpan currentDate dalam zona WIB
                    endDate: new Date(currentDate.getTime() + trialDurationInMinutes * 60000),  // Kalkulasi waktu endDate
                    status: 'active',
                },
            });

            // Konversi waktu trial baru ke WIB
            const startDateLocal = convertToWIB(newTrial.startDate);
            const endDateLocal = convertToWIB(newTrial.endDate);

            return new Response(JSON.stringify({ 
                message: 'Trial started', 
                status: 'active', 
                trial: {
                    ...newTrial,
                    startDate: startDateLocal,
                    endDate: endDateLocal
                } 
            }), { status: 201 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Internal server error', error }), { status: 500 });
    }
}
