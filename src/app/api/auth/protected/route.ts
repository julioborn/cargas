import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({ message: "Acceso permitido", user: session.user });
}
