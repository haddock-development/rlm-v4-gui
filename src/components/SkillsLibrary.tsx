'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { rlmClient } from '@/lib/api';
import type { Skill } from '@/lib/types';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  math: 'bg-blue-500/10 text-blue-500',
  verification: 'bg-green-500/10 text-green-500',
  reasoning: 'bg-purple-500/10 text-purple-500',
  research: 'bg-orange-500/10 text-orange-500',
  code: 'bg-cyan-500/10 text-cyan-500',
  general: 'bg-gray-500/10 text-gray-500',
};

export function SkillsLibrary() {
  const [skills, setSkills] = useState<Record<string, Skill>>({});
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Skill>>({});
  const [saving, setSaving] = useState(false);

  // Create state
  const [isCreating, setIsCreating] = useState(false);
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({
    id: '',
    description: '',
    category: 'general',
    prompt_template: '',
    behavior: '',
    trigger_patterns: [],
  });

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await rlmClient.getSkills();
      setSkills(response.skills);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleSelectSkill = (skillId: string) => {
    setSelectedSkill(skillId);
    setIsEditing(false);
    setIsCreating(false);
    setEditForm(skills[skillId]);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm(skills[selectedSkill!]);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(skills[selectedSkill!]);
  };

  const handleSaveEdit = async () => {
    if (!selectedSkill) return;
    setSaving(true);
    try {
      await rlmClient.updateSkill(selectedSkill, editForm);
      setSkills((prev) => ({ ...prev, [selectedSkill]: { ...prev[selectedSkill], ...editForm } as Skill }));
      setIsEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save skill');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSkill) return;
    if (!confirm(`Delete skill "${selectedSkill}"?`)) return;

    try {
      await rlmClient.deleteSkill(selectedSkill);
      setSkills((prev) => {
        const next = { ...prev };
        delete next[selectedSkill];
        return next;
      });
      setSelectedSkill(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete skill');
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedSkill(null);
    setIsEditing(false);
    setNewSkill({
      id: '',
      description: '',
      category: 'general',
      prompt_template: '',
      behavior: '',
      trigger_patterns: [],
    });
  };

  const handleSaveNew = async () => {
    if (!newSkill.id) {
      setError('Skill ID is required');
      return;
    }
    setSaving(true);
    try {
      await rlmClient.createSkill(newSkill as Skill);
      setSkills((prev) => ({ ...prev, [newSkill.id!]: newSkill as Skill }));
      setIsCreating(false);
      setSelectedSkill(newSkill.id!);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create skill');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-pulse">Loading skills...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-destructive">
          {error}
          <Button variant="link" onClick={loadSkills} className="ml-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const skillList = Object.entries(skills);
  const currentSkill = selectedSkill ? skills[selectedSkill] : null;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Skills List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="text-primary">◈</span>
                Skills Library
              </CardTitle>
              <Button size="sm" variant="outline" onClick={handleCreateNew}>
                + New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {skillList.map(([id, skill]) => (
                  <Card
                    key={id}
                    className={cn(
                      'cursor-pointer transition-all',
                      selectedSkill === id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50 hover:bg-primary/5'
                    )}
                    onClick={() => handleSelectSkill(id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs">{id}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px]',
                            CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.general
                          )}
                        >
                          {skill.category}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2">
                        {skill.description}
                      </div>
                      {skill.trigger_patterns && skill.trigger_patterns.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {skill.trigger_patterns.slice(0, 3).map((p, i) => (
                            <Badge key={i} variant="secondary" className="text-[8px]">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Skill Details / Editor */}
      <div className="lg:col-span-2">
        {isCreating ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Create New Skill</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Skill ID</Label>
                  <Input
                    value={newSkill.id}
                    onChange={(e) => setNewSkill({ ...newSkill, id: e.target.value })}
                    placeholder="my_skill_name"
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  >
                    <option value="general">General</option>
                    <option value="math">Math</option>
                    <option value="verification">Verification</option>
                    <option value="reasoning">Reasoning</option>
                    <option value="research">Research</option>
                    <option value="code">Code</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Input
                  value={newSkill.description}
                  onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                  placeholder="Brief description of what this skill does"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Behavior</Label>
                <Input
                  value={newSkill.behavior}
                  onChange={(e) => setNewSkill({ ...newSkill, behavior: e.target.value })}
                  placeholder="e.g., auto_verify, self_check"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Trigger Patterns (comma-separated)</Label>
                <Input
                  value={newSkill.trigger_patterns?.join(', ') || ''}
                  onChange={(e) =>
                    setNewSkill({
                      ...newSkill,
                      trigger_patterns: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="factorial, prime, calculation"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Prompt Template (Markdown)</Label>
                <Textarea
                  value={newSkill.prompt_template}
                  onChange={(e) => setNewSkill({ ...newSkill, prompt_template: e.target.value })}
                  placeholder="# Skill Template&#10;&#10;Instructions..."
                  className="mt-1 font-mono text-xs min-h-[200px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelCreate}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNew} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Skill'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : currentSkill ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span className="font-mono">{selectedSkill}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      CATEGORY_COLORS[currentSkill.category] || CATEGORY_COLORS.general
                    )}
                  >
                    {currentSkill.category}
                  </Badge>
                </CardTitle>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDelete}>
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Category</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mt-1"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        <option value="general">General</option>
                        <option value="math">Math</option>
                        <option value="verification">Verification</option>
                        <option value="reasoning">Reasoning</option>
                        <option value="research">Research</option>
                        <option value="code">Code</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Behavior</Label>
                      <Input
                        value={editForm.behavior || ''}
                        onChange={(e) => setEditForm({ ...editForm, behavior: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Trigger Patterns (comma-separated)</Label>
                    <Input
                      value={editForm.trigger_patterns?.join(', ') || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          trigger_patterns: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Prompt Template (Markdown)</Label>
                    <Textarea
                      value={editForm.prompt_template || ''}
                      onChange={(e) => setEditForm({ ...editForm, prompt_template: e.target.value })}
                      className="mt-1 font-mono text-xs min-h-[300px]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Description</div>
                    <div className="text-sm">{currentSkill.description}</div>
                  </div>

                  {currentSkill.behavior && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Behavior</div>
                      <Badge variant="secondary">{currentSkill.behavior}</Badge>
                    </div>
                  )}

                  {currentSkill.trigger_patterns && currentSkill.trigger_patterns.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">Trigger Patterns</div>
                      <div className="flex flex-wrap gap-1">
                        {currentSkill.trigger_patterns.map((p, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Prompt Template</div>
                    <Card className="bg-muted/30">
                      <CardContent className="p-3">
                        <pre className="text-xs whitespace-pre-wrap font-mono overflow-x-auto">
                          {currentSkill.prompt_template}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              Select a skill to view details or create a new one
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
