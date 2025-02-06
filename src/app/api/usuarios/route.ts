import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Usuario from "@/models/Usuario";

export async function GET() {
    console.log("🚀 GET /api/usuarios ejecutado");
    await connectMongoDB();

    const usuarios = await Usuario.find();
    console.log("📄 Usuarios en la base de datos:", usuarios);

    return NextResponse.json({ usuarios });
}
