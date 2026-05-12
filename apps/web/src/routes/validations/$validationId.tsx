import { createFileRoute } from '@tanstack/react-router'
import { ValidationResultsPage } from '@/components/validation/ValidationResultsPage'

export const Route = createFileRoute('/validations/$validationId')({
  component: ValidationResultsPage,
})
