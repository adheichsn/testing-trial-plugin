import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Fungsi untuk mengubah ke WIB dan menghilangkan jam (hanya tanggal yang digunakan)
function convertToWIBDateOnly(date) {
    const localDate = new Date(date);
    localDate.setUTCHours(17, 0, 0, 0); // WIB = UTC+7, set jam ke 00:00 WIB (UTC+7)
    return localDate;
}

// Handler untuk GET request
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
        return new Response(JSON.stringify({ message: 'Device ID is required' }), { status: 400 });
    }

    try {
        // Cari trial berdasarkan deviceId
        const trial = await prisma.trial.findUnique({
            where: { deviceId },
        });

        if (trial) {
            const startDateLocal = convertToWIBDateOnly(trial.startDate);
            const endDateLocal = convertToWIBDateOnly(trial.endDate);

            let currentDate = convertToWIBDateOnly(new Date());

            // Debugging logging
            console.log("Current Date WIB (date only):", currentDate);
            console.log("Start Date WIB (date only):", startDateLocal);
            console.log("End Date WIB (date only):", endDateLocal);

            // Cek apakah trial masih aktif atau expired
            if (currentDate.getTime() >= startDateLocal.getTime() && currentDate.getTime() <= endDateLocal.getTime()) {
                return new Response(JSON.stringify({
                    message: 'Trial is active',
                    status: 'active',
                    trial: {
                        ...trial,
                        startDate: startDateLocal.toISOString().split('T')[0],
                        endDate: endDateLocal.toISOString().split('T')[0]
                    }
                }), { status: 200 });
            } else {
                return new Response(JSON.stringify({
                    message: 'Trial expired',
                    status: 'expired',
                    trial: {
                        ...trial,
                        startDate: startDateLocal.toISOString().split('T')[0],
                        endDate: endDateLocal.toISOString().split('T')[0]
                    }
                }), { status: 200 });
            }
        } else {
            // Jika trial tidak ditemukan
            return new Response(JSON.stringify({ message: 'Trial not found' }), { status: 404 });
        }
    } catch (error) {
        console.error("Error checking trial:", error);
        return new Response(JSON.stringify({ message: 'Internal server error', error: error.message }), { status: 500 });
    }
}

// Handler untuk POST request
export async function POST(req) {
    const { deviceId } = await req.json();

    if (!deviceId) {
        return new Response(JSON.stringify({ message: 'Device ID is required' }), { status: 400 });
    }

    try {
        // Cari trial berdasarkan deviceId
        const trial = await prisma.trial.findUnique({
            where: { deviceId },
        });

        let currentDate = convertToWIBDateOnly(new Date());

        if (trial) {
            const startDateLocal = convertToWIBDateOnly(trial.startDate);
            const endDateLocal = convertToWIBDateOnly(trial.endDate);

            // Debugging logging
            console.log("Current Date WIB (date only):", currentDate);
            console.log("Start Date WIB (date only):", startDateLocal);
            console.log("End Date WIB (date only):", endDateLocal);

            // Cek apakah trial masih aktif atau expired
            if (currentDate.getTime() >= startDateLocal.getTime() && currentDate.getTime() <= endDateLocal.getTime()) {
                return new Response(JSON.stringify({
                    message: 'Trial is active',
                    status: 'active',
                    trial: {
                        ...trial,
                        startDate: startDateLocal.toISOString().split('T')[0],
                        endDate: endDateLocal.toISOString().split('T')[0]
                    }
                }), { status: 200 });
            } else {
                return new Response(JSON.stringify({
                    message: 'Trial expired',
                    status: 'expired',
                    trial: {
                        ...trial,
                        startDate: startDateLocal.toISOString().split('T')[0],
                        endDate: endDateLocal.toISOString().split('T')[0]
                    }
                }), { status: 200 });
            }
        } else {
            // Jika trial tidak ada, buat trial baru dengan durasi 10 hari
            const trialDurationInDays = 10;  // Ubah ke 10 hari
            const newTrial = await prisma.trial.create({
                data: {
                    deviceId,
                    startDate: currentDate,
                    endDate: new Date(currentDate.getTime() + trialDurationInDays * 24 * 60 * 60 * 1000) // Set trial duration ke 10 hari
                },
            });

            const startDateLocal = convertToWIBDateOnly(newTrial.startDate);
            const endDateLocal = convertToWIBDateOnly(newTrial.endDate);

            return new Response(JSON.stringify({
                message: 'Trial started',
                status: 'active',
                trial: {
                    ...newTrial,
                    startDate: startDateLocal.toISOString().split('T')[0],
                    endDate: endDateLocal.toISOString().split('T')[0]
                }
            }), { status: 201 });
        }
    } catch (error) {
        console.error("Error creating or checking trial:", error);
        return new Response(JSON.stringify({ message: 'Internal server error', error: error.message }), { status: 500 });
    }
}
