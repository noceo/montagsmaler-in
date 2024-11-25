import { body } from 'express-validator';

export const sessionValidator = [
  body('name', 'Invalid name')
    .notEmpty()
    .bail()
    .isString()
    .isLength({ min: 3, max: 16 })
    .escape()
    .trim(),
];
