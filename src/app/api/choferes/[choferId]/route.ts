import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Empresa from "@/models/Empresa";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(req: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
    await connectMongoDB();

    try {
        const awaitedParams = await params; // ✅ Esperamos los parámetros correctamente
        const empresaId = awaitedParams.empresaId;

        if (!empresaId) {
            return NextResponse.json({ error: "ID de la empresa no proporcionado" }, { status: 400 });
        }

        const empresa = await Empresa.findById(empresaId);

        if (!empresa) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ empresa }, { status: 200 });

    } catch (error) {
        console.error("❌ Error al obtener empresa:", error);
        return NextResponse.json({ error: "Error al obtener empresa" }, { status: 500 });
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(req: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
    await connectMongoDB();

    try {
        const { nombre, direccion } = await req.json();
        const awaitedParams = await params;
        const empresaId = awaitedParams.empresaId;

        if (!empresaId) {
            return NextResponse.json({ error: "ID de la empresa no proporcionado" }, { status: 400 });
        }

        const empresaActualizada = await Empresa.findByIdAndUpdate(
            empresaId,
            { nombre, direccion },
            { new: true }
        );

        if (!empresaActualizada) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ message: "Empresa actualizada", empresa: empresaActualizada }, { status: 200 });

    } catch (error) {
        console.error("❌ Error al actualizar empresa:", error);
        return NextResponse.json({ error: "Error al actualizar empresa" }, { status: 500 });
    }
}

// 📌 Eliminar una empresa
export async function DELETE(req: NextRequest, { params }: { params: Promise<Record<string, string>> }) {
    await connectMongoDB();

    try {
        const awaitedParams = await params; // ✅ Extraemos correctamente los parámetros
        const empresaId = awaitedParams.empresaId;

        if (!empresaId) {
            return NextResponse.json({ error: "ID de la empresa no proporcionado" }, { status: 400 });
        }

        const empresaEliminada = await Empresa.findByIdAndDelete(empresaId);

        if (!empresaEliminada) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ message: "Empresa eliminada" }, { status: 200 });

    } catch (error) {
        console.error("❌ Error al eliminar empresa:", error);
        return NextResponse.json({ error: "Error al eliminar empresa" }, { status: 500 });
    }
}
