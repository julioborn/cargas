import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Unidad from "@/models/Unidad";

export async function PUT(req: Request, { params }: { params: { unidadId: string } }) {
    try {
        await connectMongoDB();
        const { matricula, tipo } = await req.json();

        const unidad = await Unidad.findByIdAndUpdate(params.unidadId, { matricula, tipo }, { new: true });

        if (!unidad) {
            return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ message: "Unidad actualizada correctamente", unidad }, { status: 200 });
    } catch (error) {
        console.error("❌ Error al actualizar unidad:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { unidadId: string } }) {
    try {
        await connectMongoDB();
        const unidad = await Unidad.findByIdAndDelete(params.unidadId);

        if (!unidad) {
            return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ message: "Unidad eliminada correctamente" }, { status: 200 });
    } catch (error) {
        console.error("❌ Error al eliminar unidad:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
