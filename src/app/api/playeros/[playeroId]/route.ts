import { NextResponse } from "next/server";
import Playero from "@/models/Playero";
import { connectMongoDB } from "@/lib/mongodb";
import "@/models/Ubicacion"; // Asegúrate de registrar el modelo Ubicacion

export async function PUT(
    request: Request,
    { params }: { params: { playeroId: string } }
) {
    try {
        await connectMongoDB();
        const { playeroId } = params;
        const body = await request.json();

        // Si se envía un nuevo nombre, convertirlo a mayúsculas
        if (body.nombre) {
            body.nombre = body.nombre.toUpperCase();
        }

        const updatedPlayero = await Playero.findByIdAndUpdate(
            playeroId,
            body,
            { new: true }
        )
            .populate("ubicacionId", "nombre")
            .lean();

        if (!updatedPlayero) {
            return NextResponse.json(
                { error: "Playero no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedPlayero);
    } catch (error) {
        console.error("❌ Error al actualizar el playero:", error);
        return NextResponse.json(
            { error: "Error al actualizar el playero" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { playeroId: string } }
) {
    try {
        await connectMongoDB();
        const { playeroId } = params;
        const deletedPlayero = await Playero.findByIdAndDelete(playeroId).lean();

        if (!deletedPlayero) {
            return NextResponse.json(
                { error: "Playero no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: "Playero eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar el playero:", error);
        return NextResponse.json(
            { error: "Error al eliminar el playero" },
            { status: 500 }
        );
    }
}
