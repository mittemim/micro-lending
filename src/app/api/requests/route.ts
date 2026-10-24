export async function POST(request: Request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "Тело запроса должно быть корректным JSON." },
      { status: 400 },
    );
  }

  return Response.json({
    success: true,
    message: "Данные получены. Проверка и сохранение пока не выполняются.",
    data: {
      name: body?.name,
      email: body?.email,
      description: body?.description,
    },
  });
}
