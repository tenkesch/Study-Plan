export async function createPlan(input) {
  let response;
  try {
    response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(
      "We couldn't reach the study planner. Check that the server is running and try again.",
    );
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      body?.error?.message || "The server could not create your plan.",
    );
    error.details = body?.error?.details;
    throw error;
  }
  return body;
}
