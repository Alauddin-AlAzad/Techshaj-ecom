import { Construction } from 'lucide-react'
import EmptyState from '../../components/admin/EmptyState.jsx'
import PageHeader from '../../components/admin/PageHeader.jsx'

// Stand-in for admin pages that are not built yet.
export default function Placeholder({ title, subtitle }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="rounded-xl border border-border bg-white">
        <EmptyState Icon={Construction} title="Coming soon" text="This section is being built." />
      </div>
    </div>
  )
}
