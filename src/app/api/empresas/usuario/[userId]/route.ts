import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Empresa from "@/models/Empresa";

export async function GET(req: Request, { params }: { params: { userId: string } }) {
    try {
        await connectMongoDB();
        console.log(`🔍 Buscando empresa para el usuario con ID: ${params.userId}`);

        const empresa = await Empresa.findOne({ propietarioId: params.userId });

        if (!empresa) {
            console.log("❌ No se encontró ninguna empresa para este usuario");
            return NextResponse.json({ error: "No tienes una empresa registrada" }, { status: 404 });
        }

        console.log("✅ Empresa encontrada:", empresa);
        return NextResponse.json(empresa, { status: 200 });

    } catch (error) {
        console.error("❌ Error en la API de empresa:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
