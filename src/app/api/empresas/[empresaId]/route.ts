import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Empresa from "@/models/Empresa";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: Request, { params }: { params: { empresaId?: string } }) {
    try {
        await connectMongoDB();

        if (!params?.empresaId) {
            console.log("❌ Error: No se proporcionó empresaId.");
            return NextResponse.json({ error: "No se proporcionó empresaId" }, { status: 400 });
        }

        const empresaId = params.empresaId;
        console.log(`🔍 Buscando empresa con ID: ${empresaId}`);

        const empresa = await Empresa.findById(empresaId);

        if (!empresa) {
            console.log(`❌ Empresa no encontrada para el ID: ${empresaId}`);
            return NextResponse.json({ error: "Empresa no encontrada", empresa: null }, { status: 200 });
        }

        console.log("✅ Empresa encontrada:", empresa);
        return NextResponse.json(empresa, { status: 200 });

    } catch (error) {
        console.error("❌ Error en la API de empresa:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: { empresaId?: string } }) {
    try {
        await connectMongoDB();

        if (!params.empresaId) {
            return NextResponse.json({ error: "Falta el ID de la empresa" }, { status: 400 });
        }

        const { nombre, ruc_cuit, direccion, telefono } = await req.json();

        const empresa = await Empresa.findByIdAndUpdate(params.empresaId, {
            nombre,
            ruc_cuit,
            direccion,
            telefono
        }, { new: true });

        if (!empresa) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }

        return NextResponse.json(empresa, { status: 200 });
    } catch (error) {
        console.error("❌ Error al actualizar empresa:", error);
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { empresaId: string } }) {
    try {
        await connectMongoDB();
        const empresa = await Empresa.findByIdAndDelete(params.empresaId);

        if (!empresa) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ message: "Empresa eliminada correctamente" }, { status: 200 });
    } catch (error) {
        console.error("❌ Error al eliminar empresa:", error);
        return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
    }
}
