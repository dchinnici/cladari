'use client'

import Link from 'next/link'
import { GitBranch, GitMerge, Users, Copy, ArrowUpRight, ChevronRight, Layers, Leaf } from 'lucide-react'

interface Plant {
  id: string
  plantId: string
  hybridName?: string | null
  species?: string | null
}

interface BreedingRecord {
  id: string
  crossId: string
  crossDate: string
  femalePlant?: Plant
  malePlant?: Plant
  f1PlantsRaised?: number | null
}

interface CloneBatch {
  id: string
  batchId: string
  propagationType: string
  cultivarName?: string | null
  species?: string | null
  externalSource?: string | null
  acquiredDate: string
}

interface LineageTabProps {
  plant: {
    id: string
    plantId: string
    hybridName?: string | null
    species?: string | null
    generation?: string | null
    propagationType?: string | null
    // Ancestry
    femaleParent?: Plant | null
    maleParent?: Plant | null
    cloneSource?: Plant | null
    breedingRecord?: BreedingRecord | null
    cloneBatch?: CloneBatch | null  // Batch this plant graduated from
    // Progeny
    femaleOffspring?: Plant[]
    maleOffspring?: Plant[]
    clones?: Plant[]
    // Breeding participation
    femaleBreedings?: BreedingRecord[]
    maleBreedings?: BreedingRecord[]
  }
}

function PlantLink({ plant, label }: { plant: Plant; label?: string }) {
  return (
    <Link
      href={`/plants/${plant.id}`}
      className="flex items-center gap-2 p-3 bg-[var(--parchment)] rounded-lg hover:bg-[var(--sage)]/30 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        {label && <p className="text-xs text-[var(--clay)] mb-0.5">{label}</p>}
        <p className="font-mono text-sm text-[var(--forest)]">{plant.plantId}</p>
        {(plant.hybridName || plant.species) && (
          <p className="text-sm text-[var(--bark)] truncate">{plant.hybridName || plant.species}</p>
        )}
      </div>
      <ArrowUpRight className="w-4 h-4 text-[var(--clay)] group-hover:text-[var(--forest)] transition-colors" />
    </Link>
  )
}

function BreedingRecordLink({ record, role }: { record: BreedingRecord; role: 'female' | 'male' }) {
  const partner = role === 'female' ? record.malePlant : record.femalePlant
  const partnerLabel = role === 'female' ? 'Male' : 'Female'

  return (
    <Link
      href={`/breeding`}
      className="block p-3 bg-[var(--parchment)] rounded-lg hover:bg-[var(--sage)]/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm text-[var(--forest)]">{record.crossId}</p>
          <p className="text-xs text-[var(--clay)] mt-0.5">
            {new Date(record.crossDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          {partner && (
            <p className="text-sm text-[var(--bark)] mt-1">
              {partnerLabel}: {partner.plantId}
            </p>
          )}
          {record.f1PlantsRaised && (
            <p className="text-xs text-[var(--moss)] mt-1">{record.f1PlantsRaised} F1 raised</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--clay)] mt-1" />
      </div>
    </Link>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-[var(--clay)] text-center py-4">{message}</p>
  )
}

export function LineageTab({ plant }: LineageTabProps) {
  const hasAncestry = plant.femaleParent || plant.maleParent || plant.cloneSource || plant.breedingRecord || plant.cloneBatch
  const hasProgeny = (plant.femaleOffspring?.length || 0) > 0 ||
                     (plant.maleOffspring?.length || 0) > 0 ||
                     (plant.clones?.length || 0) > 0
  const hasBreedingParticipation = (plant.femaleBreedings?.length || 0) > 0 ||
                                   (plant.maleBreedings?.length || 0) > 0

  // Combine offspring from both roles and deduplicate
  const allOffspring = [
    ...(plant.femaleOffspring || []).map(p => ({ ...p, role: 'female' as const })),
    ...(plant.maleOffspring || []).map(p => ({ ...p, role: 'male' as const }))
  ]
  const uniqueOffspring = allOffspring.filter((p, i, arr) =>
    arr.findIndex(x => x.id === p.id) === i
  )

  return (
    <div className="space-y-8">
      {/* Generation Badge */}
      {(plant.generation || plant.propagationType) && (
        <div className="flex items-center gap-2">
          {plant.generation && (
            <span className="px-3 py-1 bg-[var(--forest)]/10 text-[var(--forest)] rounded-full text-sm font-medium">
              {plant.generation}
            </span>
          )}
          {plant.propagationType && (
            <span className="px-3 py-1 bg-[var(--bark)]/10 text-[var(--bark)] rounded-full text-sm capitalize">
              {plant.propagationType.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      )}

      {/* Ancestry Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-5 h-5 text-[var(--forest)]" />
          <h3 className="text-lg font-semibold text-[var(--bark)]">Ancestry</h3>
        </div>

        {hasAncestry ? (
          <div className="space-y-4">
            {/* Sexual Reproduction Parents */}
            {(plant.femaleParent || plant.maleParent) && (
              <div className="grid grid-cols-2 gap-3">
                {plant.femaleParent ? (
                  <PlantLink plant={plant.femaleParent} label="Female Parent (♀)" />
                ) : (
                  <div className="p-3 bg-[var(--parchment)]/50 rounded-lg border border-dashed border-black/[0.08]">
                    <p className="text-xs text-[var(--clay)]">Female Parent (♀)</p>
                    <p className="text-sm text-[var(--clay)]">Unknown</p>
                  </div>
                )}
                {plant.maleParent ? (
                  <PlantLink plant={plant.maleParent} label="Male Parent (♂)" />
                ) : (
                  <div className="p-3 bg-[var(--parchment)]/50 rounded-lg border border-dashed border-black/[0.08]">
                    <p className="text-xs text-[var(--clay)]">Male Parent (♂)</p>
                    <p className="text-sm text-[var(--clay)]">Unknown</p>
                  </div>
                )}
              </div>
            )}

            {/* Clone Source */}
            {plant.cloneSource && (
              <div>
                <p className="text-xs text-[var(--clay)] mb-2 flex items-center gap-1">
                  <Copy className="w-3 h-3" />
                  Cloned From
                </p>
                <PlantLink plant={plant.cloneSource} />
              </div>
            )}

            {/* Clone Batch Origin */}
            {plant.cloneBatch && (
              <div className="p-4 bg-[var(--sage)]/20 rounded-lg border border-[var(--sage)]/30">
                <p className="text-xs text-[var(--forest)] mb-2 font-medium flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  Graduated From Batch
                </p>
                <Link
                  href={`/batches/${plant.cloneBatch.id}`}
                  className="block p-3 bg-[var(--parchment)] rounded-lg hover:bg-[var(--sage)]/30 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-[var(--forest)]">{plant.cloneBatch.batchId}</p>
                      {(plant.cloneBatch.cultivarName || plant.cloneBatch.species) && (
                        <p className="text-sm text-[var(--bark)] mt-0.5">
                          {plant.cloneBatch.cultivarName || plant.cloneBatch.species}
                        </p>
                      )}
                      <p className="text-xs text-[var(--clay)] mt-1 capitalize">
                        {plant.cloneBatch.propagationType.replace(/_/g, ' ').toLowerCase()}
                        {plant.cloneBatch.externalSource && ` • ${plant.cloneBatch.externalSource}`}
                      </p>
                      <p className="text-xs text-[var(--clay)] mt-0.5">
                        Acquired {new Date(plant.cloneBatch.acquiredDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--clay)] group-hover:text-[var(--forest)] mt-1" />
                  </div>
                </Link>
              </div>
            )}

            {/* Breeding Record Origin */}
            {plant.breedingRecord && (
              <div className="p-4 bg-[var(--moss)]/10 rounded-lg border border-[var(--moss)]/20">
                <p className="text-xs text-[var(--moss)] mb-2 font-medium">From Documented Cross</p>
                <Link
                  href="/breeding"
                  className="font-mono text-[var(--forest)] hover:underline"
                >
                  {plant.breedingRecord.crossId}
                </Link>
                <p className="text-sm text-[var(--bark)] mt-1">
                  {new Date(plant.breedingRecord.crossDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        ) : (
          <EmptyState message="No ancestry information recorded" />
        )}
      </section>

      {/* Progeny Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[var(--forest)]" />
          <h3 className="text-lg font-semibold text-[var(--bark)]">Progeny</h3>
        </div>

        {hasProgeny ? (
          <div className="space-y-4">
            {/* Sexual Offspring */}
            {uniqueOffspring.length > 0 && (
              <div>
                <p className="text-xs text-[var(--clay)] mb-2">
                  Offspring ({uniqueOffspring.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {uniqueOffspring.slice(0, 6).map(offspring => (
                    <PlantLink key={offspring.id} plant={offspring} />
                  ))}
                </div>
                {uniqueOffspring.length > 6 && (
                  <p className="text-sm text-[var(--moss)] mt-2 text-center">
                    +{uniqueOffspring.length - 6} more
                  </p>
                )}
              </div>
            )}

            {/* Clones */}
            {plant.clones && plant.clones.length > 0 && (
              <div>
                <p className="text-xs text-[var(--clay)] mb-2 flex items-center gap-1">
                  <Copy className="w-3 h-3" />
                  Clones ({plant.clones.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {plant.clones.slice(0, 4).map(clone => (
                    <PlantLink key={clone.id} plant={clone} />
                  ))}
                </div>
                {plant.clones.length > 4 && (
                  <p className="text-sm text-[var(--moss)] mt-2 text-center">
                    +{plant.clones.length - 4} more
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <EmptyState message="No progeny recorded" />
        )}
      </section>

      {/* Breeding Participation Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <GitMerge className="w-5 h-5 text-[var(--forest)]" />
          <h3 className="text-lg font-semibold text-[var(--bark)]">Breeding Participation</h3>
        </div>

        {hasBreedingParticipation ? (
          <div className="space-y-4">
            {/* As Female Parent */}
            {plant.femaleBreedings && plant.femaleBreedings.length > 0 && (
              <div>
                <p className="text-xs text-[var(--clay)] mb-2">
                  As Female Parent ♀ ({plant.femaleBreedings.length} cross{plant.femaleBreedings.length > 1 ? 'es' : ''})
                </p>
                <div className="space-y-2">
                  {plant.femaleBreedings.slice(0, 3).map(breeding => (
                    <BreedingRecordLink key={breeding.id} record={breeding} role="female" />
                  ))}
                </div>
                {plant.femaleBreedings.length > 3 && (
                  <Link href="/breeding" className="text-sm text-[var(--moss)] mt-2 block text-center hover:underline">
                    View all {plant.femaleBreedings.length} crosses →
                  </Link>
                )}
              </div>
            )}

            {/* As Male Parent */}
            {plant.maleBreedings && plant.maleBreedings.length > 0 && (
              <div>
                <p className="text-xs text-[var(--clay)] mb-2">
                  As Male Parent ♂ ({plant.maleBreedings.length} cross{plant.maleBreedings.length > 1 ? 'es' : ''})
                </p>
                <div className="space-y-2">
                  {plant.maleBreedings.slice(0, 3).map(breeding => (
                    <BreedingRecordLink key={breeding.id} record={breeding} role="male" />
                  ))}
                </div>
                {plant.maleBreedings.length > 3 && (
                  <Link href="/breeding" className="text-sm text-[var(--moss)] mt-2 block text-center hover:underline">
                    View all {plant.maleBreedings.length} crosses →
                  </Link>
                )}
              </div>
            )}
          </div>
        ) : (
          <EmptyState message="Not used in any breeding records yet" />
        )}
      </section>

      {/* Future: Family Tree Visualization Placeholder */}
      {(hasAncestry || hasProgeny) && (
        <div className="mt-8 p-4 bg-[var(--parchment)] rounded-lg border border-dashed border-black/[0.08] text-center">
          <p className="text-sm text-[var(--clay)]">
            🌳 Interactive family tree visualization coming soon
          </p>
        </div>
      )}
    </div>
  )
}
