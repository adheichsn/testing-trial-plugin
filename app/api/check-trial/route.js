// File: app/api/check-trial/route.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(req) {
    const { deviceId } = await req.json();

    if (!deviceId) {
        return new Response(JSON.stringify({ message: 'Device ID is required' }), { status: 400 });
    }

    try {
        const trial = await prisma.trial.findUnique({
            where: { deviceId },
        });

        const currentDate = new Date();

        if (trial) {
            // Mengecek apakah trial masih dalam waktu active
            if (currentDate >= trial.startDate && currentDate <= trial.endDate) {
                return new Response(JSON.stringify({ message: 'Trial is active', status: 'active', trial }), { status: 200 });
            } else {
                return new Response(JSON.stringify({ message: 'Trial expired', status: 'expired', trial }), { status: 200 });
            }
        } else {
            // Jika trial belum ada, buat trial baru (misalnya 10 menit)
            const trialDurationInMinutes = 10;
            const newTrial = await prisma.trial.create({
                data: {
                    deviceId,
                    startDate: currentDate,
                    endDate: new Date(currentDate.getTime() + trialDurationInMinutes * 60000),
                    status: 'active', // Status disimpan sebagai 'active' saat trial dimulai
                },
            });

            return new Response(JSON.stringify({ message: 'Trial started', status: 'active', trial: newTrial }), { status: 201 });
        }
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Internal server error', error }), { status: 500 });
    }
}
