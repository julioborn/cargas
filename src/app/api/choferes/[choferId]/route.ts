import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Chofer from "@/models/Chofer";
import { NextRequest } from "next/server"; // ✅ Importar NextRequest

// 📌 Editar un chofer
export async function PUT(req: NextRequest, { params }: { params: { choferId: string } }) {
    await connectMongoDB();

    try {
        const { nombre, documento } = await req.json();
        const { choferId } = params; // ✅ Extraer params correctamente

        const choferActualizado = await Chofer.findByIdAndUpdate(
            choferId, 
            { nombre, documento },
            { new: true }
        );

        if (!choferActualizado) {
            return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ message: "Chofer actualizado", chofer: choferActualizado }, { status: 200 });

    } catch (error) {
        console.error("❌ Error al actualizar chofer:", error);
        return NextResponse.json({ error: "Error al actualizar chofer" }, { status: 500 });
    }
}

// 📌 Eliminar un chofer
export async function DELETE(req: NextRequest, { params }: { params: { choferId: string } }) {
    await connectMongoDB();

    try {
        const { choferId } = params; // ✅ Extraer params correctamente

        const choferEliminado = await Chofer.findByIdAndDelete(choferId);

        if (!choferEliminado) {
            return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ message: "Chofer eliminado" }, { status: 200 });

    } catch (error) {
        console.error("❌ Error al eliminar chofer:", error);
        return NextResponse.json({ error: "Error al eliminar chofer" }, { status: 500 });
    }
}
