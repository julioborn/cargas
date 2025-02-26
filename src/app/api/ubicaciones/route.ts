import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Ubicacion from "@/models/Ubicacion";

export async function GET(req: Request) {
    try {
        await connectMongoDB();
        const ubicaciones = await Ubicacion.find({}).lean();
        return NextResponse.json(ubicaciones);
    } catch (error) {
        console.error("❌ Error obteniendo ubicaciones:", error);
        return NextResponse.json({ error: "Error obteniendo ubicaciones" }, { status: 500 });
    }
}
