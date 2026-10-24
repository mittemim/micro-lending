"use client";

import { useState, type FormEvent } from "react";
import styles from "./page.module.css";

type Fields = { name: string; email: string; description: string };
type Errors = Partial<Record<keyof Fields, string>>;
type ApiResponse = {
  success?: boolean;
  message?: string;
  errors?: { fieldErrors?: Partial<Record<keyof Fields, string[]>> };
};

export default function Home() {
  const [fields, setFields] = useState<Fields>({ name: "", email: "", description: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");

  function updateField(field: keyof Fields, value: string) {
    setFields((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setSuccess(false);
    setRequestError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setSuccess(false);
    setRequestError("");
    const nextErrors: Errors = {};
    if (!fields.name.trim()) nextErrors.name = "Укажите ваше имя.";
    if (!fields.email.trim()) {
      nextErrors.email = "Укажите email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      nextErrors.email = "Введите email в формате name@example.com.";
    }
    if (!fields.description.trim()) nextErrors.description = "Расскажите немного о вашей задаче.";
    setErrors(nextErrors);
    const firstInvalidField = Object.keys(nextErrors)[0];
    if (firstInvalidField) {
      document.getElementById(firstInvalidField)?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data: ApiResponse = await response.json();

      if (!response.ok || data.success !== true) {
        const apiErrors: Errors = {};
        for (const field of ["name", "email", "description"] as const) {
          const messages = data.errors?.fieldErrors?.[field];
          if (Array.isArray(messages) && typeof messages[0] === "string") {
            apiErrors[field] = messages[0];
          }
        }
        setErrors(apiErrors);
        setRequestError(
          typeof data.message === "string"
            ? data.message
            : "Не удалось отправить форму. Попробуйте ещё раз.",
        );
        return;
      }

      setSuccess(true);
    } catch {
      setRequestError("Не удалось получить ответ сервера. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="#hero" aria-label="Точка — на главную">точка<span>✳</span></a>
        <nav className={styles.nav} aria-label="Навигация по странице">
          <a href="#hero">Главная</a>
          <a href="#benefits">Плюсы</a>
          <a href="#questions">Вопросы</a>
          <a href="#form">Обсудить задачу ↗</a>
        </nav>
      </header>

      <main>
        <section id="hero" className={styles.hero} aria-labelledby="hero-title">
          <div>
            <p className={styles.eyebrow}>НЕБОЛЬШАЯ СТУДИЯ. БОЛЬШИЕ ИДЕИ.</p>
            <h1 id="hero-title">У вашей идеи<br />есть <span>точка старта.</span></h1>
            <p className={styles.lead}>Помогаем превратить задумку в понятный сайт. С вниманием к деталям, вашему делу и людям, для которых вы работаете.</p>
            <a href="#form" className={styles.button}>Расскажите о задаче <span aria-hidden="true">↗</span></a>
            <p className={styles.small}>Начнём с простого — с вашей идеи.</p>
          </div>
          <div className={styles.art} aria-hidden="true">
            <span className={styles.artLabel}>ОТ ИДЕИ К ФОРМЕ</span>
            <div className={styles.orbit} />
            <div className={styles.disc}>✳</div>
            <div className={styles.artNote}>Всё начинается<br />с одной точки.</div>
            <span className={styles.artIndex}>01 / СТАРТ</span>
          </div>
        </section>

        <section id="benefits" className={styles.section} aria-labelledby="benefits-title">
          <p className={styles.eyebrow}>01 / ПЛЮСЫ</p>
          <h2 id="benefits-title">Меньше сложности.<br />Больше смысла.</h2>
          <div className={styles.cards}>
            {[
              ["01", "Начинаем с главного", "Разбираемся в вашей задаче и собираем страницу вокруг того, что действительно важно."],
              ["02", "Говорим понятно", "Объясняем решения простыми словами. Вы понимаете, что происходит на каждом этапе."],
              ["03", "Заботимся о деталях", "Удобная навигация, аккуратная типографика и внимание к небольшим экранам."],
            ].map(([number, title, text]) => (
              <article className={styles.card} key={number}>
                <span className={styles.number}>{number} ↗</span>
                <h3>{title}</h3><p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="questions" className={`${styles.section} ${styles.questions}`} aria-labelledby="questions-title">
          <div><p className={styles.eyebrow}>02 / ВОПРОСЫ</p><h2 id="questions-title">Хороший вопрос —<br />уже начало.</h2></div>
          <div className={styles.faq}>
            <details open><summary>Можно прийти только с идеей?</summary><p>Да. Опишите, что вы хотите сделать и для кого. Готовое техническое задание для первого шага не нужно.</p></details>
            <details><summary>Что написать в описании задачи?</summary><p>Расскажите о вашем деле, цели сайта и пожеланиях. Если есть примеры или желаемые сроки, упомяните их.</p></details>
            <details><summary>Что произойдёт после заполнения формы?</summary><p>Данные отправятся на сервер для проверки и сохранения. После сохранения заявки вы увидите подтверждение.</p></details>
          </div>
        </section>

        <section id="form" className={styles.formSection} aria-labelledby="form-title">
          <div><p className={styles.eyebrow}>03 / ВАШ СЛЕДУЮЩИЙ ШАГ</p><h2 id="form-title">Давайте начнём<br />с вашей идеи<span>.</span></h2><p className={styles.lead}>Пара слов о вас и вашей задаче —<br />вот и первая точка на карте.</p><p className={styles.formNote}>Учебная форма: данные проходят проверку<br />и сохраняются в локальной базе заявок.</p></div>
          <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
            <div className={styles.field}>
              <label htmlFor="name">Имя</label>
              <input id="name" name="name" autoComplete="name" placeholder="Как к вам обращаться?" value={fields.name} onChange={(event) => updateField("name", event.target.value)} required disabled={isSubmitting} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-error" : undefined} />
              {errors.name && <p id="name-error" className={styles.error} role="alert">{errors.name}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={fields.email} onChange={(event) => updateField("email", event.target.value)} required disabled={isSubmitting} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "email-error" : undefined} />
              {errors.email && <p id="email-error" className={styles.error} role="alert">{errors.email}</p>}
            </div>
            <div className={styles.field}>
              <label htmlFor="description">Описание задачи</label>
              <textarea id="description" name="description" rows={4} placeholder="Что вы хотите создать?" value={fields.description} onChange={(event) => updateField("description", event.target.value)} required disabled={isSubmitting} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "description-error" : undefined} />
              {errors.description && <p id="description-error" className={styles.error} role="alert">{errors.description}</p>}
            </div>
            <button className={styles.button} type="submit" disabled={isSubmitting}>{isSubmitting ? "Отправляем…" : "Отправить форму"} <span aria-hidden="true">↗</span></button>
            {isSubmitting && <p role="status">Отправляем данные, подождите…</p>}
            {requestError && <p className={styles.error} role="alert">{requestError}</p>}
            {success && <p className={styles.success} role="status">Заявка успешно отправлена и сохранена.</p>}
          </form>
        </section>
      </main>
      <footer className={styles.footer}><a className={styles.brand} href="#hero">точка<span>✳</span></a><p>У каждой идеи есть начало.</p><a href="#hero">Наверх ↑</a></footer>
    </div>
  );
}
