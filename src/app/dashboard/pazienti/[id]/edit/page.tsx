import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessSede } from "@/lib/user-sede";
import { PazienteForm } from "@/components/paziente-form";
import { OPPORTUNITA_ESITI, ESITI } from "@/lib/esiti";

export default async function EditPazientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: { sede: true, medico: true, provenienza: true, modPagamento: true },
  });
  if (!patient) notFound();

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!canAccessSede(dbUser || session.user, patient.sedeId)) {
    redirect("/dashboard");
  }

  const customEsiti = (OPPORTUNITA_ESITI as readonly string[]).includes(patient.esito)
    ? OPPORTUNITA_ESITI
    : undefined;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Modifica Paziente</h1>
      <PazienteForm initialData={JSON.parse(JSON.stringify(patient))} customEsiti={customEsiti} />
    </div>
  );
}
