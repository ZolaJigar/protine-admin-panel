'use client';

import {
  Box, Typography, Checkbox, FormControlLabel, Paper, Divider,
} from '@mui/material';

/**
 * Builds a permission tree from a flat array.
 * Supports any depth — leaf nodes have children: []
 */
function buildTree(permissions) {
  const map = {};
  // normalise all ids to numbers
  permissions.forEach((p) => {
    map[Number(p.id)] = { ...p, id: Number(p.id), parent_id: p.parent_id != null ? Number(p.parent_id) : null, children: [] };
  });
  const roots = [];
  permissions.forEach((p) => {
    const node = map[Number(p.id)];
    if (node.parent_id === null) {
      roots.push(node);
    } else if (map[node.parent_id]) {
      map[node.parent_id].children.push(node);
    }
  });
  // sort each level by order_index
  const sortByOrder = (arr) => arr.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  sortByOrder(roots);
  roots.forEach((r) => {
    sortByOrder(r.children);
    r.children.forEach((c) => sortByOrder(c.children));
  });
  return roots;
}

/** Collect all leaf ids inside a subtree node */
function getLeafIds(node) {
  if (!node.children || node.children.length === 0) return [node.id];
  return node.children.flatMap((c) => getLeafIds(c));
}

export default function PermissionsCheckboxGroup({
  allPermissions = [],
  selectedIds    = [],
  onChange,
  disabled       = false,
}) {
  const selected = new Set(selectedIds.map(Number));
  const tree     = buildTree(allPermissions);

  const toggle = (ids, checked) => {
    const next = new Set(selected);
    ids.map(Number).forEach((id) => (checked ? next.add(id) : next.delete(id)));
    onChange && onChange([...next]);
  };

  const groupState = (leafIds) => {
    const cnt = leafIds.filter((id) => selected.has(id)).length;
    if (cnt === 0)               return 'none';
    if (cnt === leafIds.length)  return 'all';
    return 'some';
  };

  if (tree.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled" sx={{ py: 2, textAlign: 'center' }}>
        No permissions available.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {tree.map((module) => {
        const moduleLeafIds = getLeafIds(module);
        const moduleState   = groupState(moduleLeafIds);

        // Detect layout: are ALL children leaves (no grandchildren)?
        const allChildrenAreLeaves = module.children.length > 0
          && module.children.every((c) => (c.children ?? []).length === 0);

        return (
          <Paper key={module.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {/* ── Module header ── */}
            <Box sx={{ px: 2, py: 1, bgcolor: '#F1F5F0', display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                label={
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: '#1B4332' }}>
                    {module.name}
                  </Typography>
                }
                control={
                  <Checkbox
                    size="small" disabled={disabled}
                    checked={moduleState === 'all'}
                    indeterminate={moduleState === 'some'}
                    onChange={(e) => toggle(moduleLeafIds, e.target.checked)}
                    sx={{ color: '#1B4332', '&.Mui-checked': { color: '#1B4332' } }}
                  />
                }
              />
              <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                {moduleLeafIds.filter((id) => selected.has(id)).length} / {moduleLeafIds.length}
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ px: 2, py: 1.5 }}>
              {module.children.length === 0 ? (
                // Module itself is a leaf
                <FormControlLabel
                  label={<Typography variant="body2">{module.name}</Typography>}
                  control={
                    <Checkbox
                      size="small" disabled={disabled}
                      checked={selected.has(module.id)}
                      onChange={(e) => toggle([module.id], e.target.checked)}
                      sx={{ color: '#1B4332', '&.Mui-checked': { color: '#1B4332' } }}
                    />
                  }
                />
              ) : allChildrenAreLeaves ? (
                // ── 2-level: module → leaves directly — all in one row ──
                <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                  {module.children.map((leaf) => (
                    <FormControlLabel
                      key={leaf.id}
                      label={<Typography variant="body2" sx={{ fontSize: 13 }}>{leaf.name}</Typography>}
                      control={
                        <Checkbox
                          size="small" disabled={disabled}
                          checked={selected.has(leaf.id)}
                          onChange={(e) => toggle([leaf.id], e.target.checked)}
                          sx={{ color: '#57534E', '&.Mui-checked': { color: '#1B4332' } }}
                        />
                      }
                      sx={{ mr: 2, mb: 0.5, minWidth: 130 }}
                    />
                  ))}
                </Box>
              ) : (
                // ── 3-level: module → section → leaves ──
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {module.children.map((section) => {
                    const sectionLeafIds = getLeafIds(section);
                    const sectionState   = groupState(sectionLeafIds);
                    const sectionIsFlat  = section.children.every((c) => (c.children ?? []).length === 0);

                    return (
                      <Box key={section.id}>
                        {/* Section header */}
                        <FormControlLabel
                          label={
                            <Typography sx={{ fontWeight: 600, fontSize: 13, color: '#44403C' }}>
                              {section.name}
                            </Typography>
                          }
                          control={
                            <Checkbox
                              size="small" disabled={disabled}
                              checked={sectionState === 'all'}
                              indeterminate={sectionState === 'some'}
                              onChange={(e) => toggle(sectionLeafIds, e.target.checked)}
                              sx={{ color: '#2D6A4F', '&.Mui-checked': { color: '#2D6A4F' } }}
                            />
                          }
                        />
                        {/* Section leaves — horizontal row */}
                        {section.children.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', ml: 3 }}>
                            {section.children.map((leaf) => (
                              <FormControlLabel
                                key={leaf.id}
                                label={<Typography variant="body2" sx={{ fontSize: 13 }}>{leaf.name}</Typography>}
                                control={
                                  <Checkbox
                                    size="small" disabled={disabled}
                                    checked={selected.has(leaf.id)}
                                    onChange={(e) => toggle([leaf.id], e.target.checked)}
                                    sx={{ color: '#57534E', '&.Mui-checked': { color: '#1B4332' } }}
                                  />
                                }
                                sx={{ mr: 2, mb: 0.5, minWidth: 130 }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}
