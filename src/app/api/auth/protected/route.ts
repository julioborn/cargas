import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // ✅ Importación correcta

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({ message: "Ruta protegida", user: session.user });
}
