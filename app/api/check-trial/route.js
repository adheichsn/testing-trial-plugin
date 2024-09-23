import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function convertToWIB(date) {
    const localDate = new Date(date);
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

        let currentDate = new Date();
        currentDate = convertToWIB(currentDate);

        console.log("Current Date WIB:", currentDate);
        console.log("Trial Start Date WIB:", trial ? convertToWIB(trial.startDate) : null);
        console.log("Trial End Date WIB:", trial ? convertToWIB(trial.endDate) : null);

        if (trial) {
            const startDateLocal = convertToWIB(trial.startDate);
            const endDateLocal = convertToWIB(trial.endDate);

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
            const trialDurationInMinutes = 10;
            const newTrial = await prisma.trial.create({
                data: {
                    deviceId,
                    startDate: currentDate,
                    endDate: new Date(currentDate.getTime() + trialDurationInMinutes * 60000),
                    status: 'active',
                },
            });

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
        console.error("Error checking trial:", error);
        return new Response(JSON.stringify({ message: 'Internal server error', error }), { status: 500 });
    }
}
