export function validateRequest(req, res, next) {
  const errors = req.validationErrors;
  if (errors?.length) {
    return res.status(400).json({
      message: 'Please correct the highlighted information.',
      errors: errors.map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }
  next();
}

export async function collectValidation(req, res, next) {
  const { validationResult } = await import('express-validator');
  req.validationErrors = validationResult(req).array();
  next();
}
