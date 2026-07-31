export function isNetlifyRuntime() {
  return Boolean(
    process.env.NETLIFY ||
      process.env.CONTEXT ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT,
  );
}
