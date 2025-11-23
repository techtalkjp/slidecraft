import { Fragment } from 'react'
import { Link, useMatches } from 'react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/components/ui/breadcrumb'

interface BreadcrumbItemProps {
  label: string
  to?: string
}

function isBreadcrumbHandle(
  handle: unknown,
): handle is { breadcrumb: (data: unknown) => BreadcrumbItemProps } {
  return (
    typeof handle === 'object' &&
    !!handle &&
    'breadcrumb' in handle &&
    typeof handle.breadcrumb === 'function'
  )
}

export const useBreadcrumbs = () => {
  const matches = useMatches()
  const breadcrumbMatches = matches.filter((match) =>
    isBreadcrumbHandle(match.handle),
  )

  const breadcrumbItems = breadcrumbMatches.map((match) => {
    if (!isBreadcrumbHandle(match.handle)) {
      return null
    }
    return match.handle.breadcrumb(match.data)
  }) as BreadcrumbItemProps[]

  const Breadcrumbs = () => {
    if (breadcrumbItems.length === 0) {
      return null
    }

    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/projects">プロジェクト</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumbItems.map((item, idx) => {
            const isLast = idx === breadcrumbItems.length - 1

            return (
              <Fragment key={`breadcrumb-item-${idx}-${item.label}`}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {item.to && !isLast ? (
                    <BreadcrumbLink asChild>
                      <Link to={item.to}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return { Breadcrumbs }
}
