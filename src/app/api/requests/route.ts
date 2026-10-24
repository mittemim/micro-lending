import { z } from "zod";

const requestSchema = z.object({
  name: z.string({ error: "Укажите имя строкой." })
    .trim()
    .min(1, "Укажите имя.")
    .max(24, "Имя должно содержать не более 24 символов.")
    .regex(
      /^(?=.*\p{L})[\p{L}\p{M} \-–—]+$/u,
      "Имя может содержать только буквы, пробелы и тире.",
    ),
  email: z.string({ error: "Укажите email строкой." })
    .trim()
    .min(1, "Укажите email.")
    .max(100, "Email должен содержать не более 100 символов.")
    .pipe(z.email({ error: "Введите email с @ и доменом, например name@example.com." })),
  description: z.string({ error: "Укажите описание задачи строкой." })
    .trim()
    .min(10, "Описание слишком короткое: нужно не менее 10 символов.")
    .max(1000, "Описание должно содержать не более 1000 символов."),
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, message: "Тело запроса должно быть корректным JSON." },
      { status: 400 },
    );
  }

  const result = requestSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      {
        success: false,
        message: "Проверьте заполнение полей.",
        errors: z.flattenError(result.error),
      },
      { status: 400 },
    );
  }

  return Response.json({
    success: true,
    message: "Данные прошли проверку. Сохранение пока не выполняется.",
    data: result.data,
  });
}
