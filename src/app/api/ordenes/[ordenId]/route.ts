import { NextResponse } from "next/server";
import Orden from "@/models/Orden";
import { connectMongoDB } from "@/lib/mongodb";

export async function PUT(req: Request, { params }: { params: { ordenId: string } }) {
    try {
        await connectMongoDB();
        const body = await req.json();
        const updatedOrden = await Orden.findByIdAndUpdate(params.ordenId, body, { new: true });

        if (!updatedOrden) {
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        return NextResponse.json(updatedOrden);
    } catch (error) {
        console.error("❌ Error al actualizar orden:", error);
        return NextResponse.json({ error: "Error al actualizar la orden" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: { ordenId: string } }) {
    try {
        await connectMongoDB();
        const deletedOrden = await Orden.findByIdAndDelete(params.ordenId);

        if (!deletedOrden) {
            return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        return NextResponse.json({ message: "Orden eliminada correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar orden:", error);
        return NextResponse.json({ error: "Error al eliminar la orden" }, { status: 500 });
    }
}
