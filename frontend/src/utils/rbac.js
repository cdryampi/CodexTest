const toList = (value) => {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  return [value];
};

const normalize = (value) =>
  toList(value)
    .map((item) => {
      if (item == null) {
        return null;
      }
      const stringValue = typeof item === 'string' ? item : `${item}`;
      return stringValue.trim().toLowerCase();
    })
    .filter(Boolean);

const extractId = (entity) => {
  if (entity == null) {
    return null;
  }
  if (typeof entity === 'object') {
    const candidate =
      entity.id ??
      entity.pk ??
      entity.uuid ??
      entity.user_id ??
      entity.userId ??
      entity.user ??
      entity.owner_id ??
      entity.ownerId ??
      entity.author_id ??
      entity.authorId ??
      entity.slug ??
      entity.value ??
      null;

    if (candidate == null) {
      return null;
    }
    return extractId(candidate);
  }
  try {
    return `${entity}`;
  } catch (error) {
    return null;
  }
};

const getPostStatus = (post) => {
  if (!post) {
    return '';
  }
  const status =
    post.status ??
    post.state ??
    post.workflow_state ??
    post.publication_status ??
    post.stage ??
    '';
  if (!status) {
    return '';
  }
  try {
    return `${status}`.trim().toLowerCase();
  } catch (error) {
    return '';
  }
};

export const normalizeRoles = (roles) => normalize(roles);

export const normalizePermissions = (permissions) => normalize(permissions);

export const userHasRole = (roles, requiredRoles) => {
  const granted = normalizeRoles(roles);
  const required = normalize(requiredRoles);
  if (granted.length === 0 || required.length === 0) {
    return false;
  }
  return required.some((role) => granted.includes(role));
};

export const userHasPermission = (permissions, requiredPermissions) => {
  const granted = normalizePermissions(permissions);
  const required = normalize(requiredPermissions);
  if (granted.length === 0 || required.length === 0) {
    return false;
  }
  return required.some((permission) => granted.includes(permission));
};

export const getUserId = (user) => extractId(user);

export const getPostOwnerId = (post) => {
  if (!post) {
    return null;
  }
  const ownerCandidate =
    post.created_by ??
    post.createdBy ??
    post.author ??
    post.owner ??
    post.user ??
    post.created_by_id ??
    post.createdById ??
    post.author_id ??
    post.owner_id ??
    post.user_id ??
    null;

  return extractId(ownerCandidate);
};

const AUTHOR_ALLOWED_STATUSES = new Set(['draft', 'in_review', 'in review']);

const hasEditorialPrivileges = (roles, permissions) =>
  userHasRole(roles, ['admin', 'editor']) ||
  userHasPermission(permissions, [
    'posts.manage',
    'posts.manage_posts',
    'posts.change_post',
    'posts.edit_post',
    'posts:edit'
  ]);

export const isAuthorRoleOnly = (roles) => {
  const normalized = normalizeRoles(roles);
  if (normalized.includes('admin') || normalized.includes('editor')) {
    return false;
  }
  return normalized.includes('author');
};

export const canCreatePost = (auth) => {
  if (!auth) {
    return false;
  }
  const { roles, permissions } = auth;
  if (hasEditorialPrivileges(roles, permissions)) {
    return true;
  }
  if (userHasPermission(permissions, ['posts.add_post', 'posts:create', 'posts.create_post'])) {
    return true;
  }
  return userHasRole(roles, ['author']);
};

export const canAuthorEditPost = (auth, post) => {
  if (!auth || !post) {
    return false;
  }
  const { user, roles } = auth;
  if (!isAuthorRoleOnly(roles)) {
    return false;
  }
  const userId = getUserId(user);
  const ownerId = getPostOwnerId(post);
  if (userId && ownerId && userId === ownerId) {
    const status = getPostStatus(post);
    if (!status || AUTHOR_ALLOWED_STATUSES.has(status)) {
      return true;
    }
  }
  return false;
};

export const canEditPost = (auth, post) => {
  if (!auth) {
    return false;
  }
  const { roles, permissions } = auth;
  if (hasEditorialPrivileges(roles, permissions)) {
    return true;
  }
  if (post && userHasPermission(permissions, ['posts.edit_any', 'posts.update_post'])) {
    return true;
  }
  if (!post) {
    return canCreatePost(auth);
  }
  return canAuthorEditPost(auth, post);
};

export const canDeletePost = (auth, post) => {
  if (!auth) {
    return false;
  }
  const { roles, permissions } = auth;
  if (userHasRole(roles, ['admin'])) {
    return true;
  }
  if (userHasPermission(permissions, ['posts.delete_post', 'posts.manage_posts', 'posts:delete'])) {
    return true;
  }
  if (userHasRole(roles, ['editor'])) {
    return true;
  }
  if (post && canAuthorEditPost(auth, post)) {
    return userHasPermission(permissions, ['posts.delete_own', 'posts.delete_own_post']);
  }
  return false;
};

export const canPublishPost = (auth) => {
  if (!auth) {
    return false;
  }
  const { roles, permissions } = auth;
  if (userHasRole(roles, ['admin', 'editor'])) {
    return true;
  }
  return userHasPermission(permissions, ['posts.publish_post', 'posts.manage_publication']);
};

export const canManageTaxonomies = (auth) => {
  if (!auth) {
    return false;
  }
  const { roles, permissions } = auth;
  if (userHasRole(roles, ['admin', 'editor'])) {
    return true;
  }
  return userHasPermission(permissions, [
    'categories.manage',
    'tags.manage',
    'taxonomy.manage',
    'categories.change_category',
    'tags.change_tag'
  ]);
};

export const canModerateComments = (auth) => {
  if (!auth) {
    return false;
  }
  const { roles, permissions } = auth;
  if (userHasRole(roles, ['admin', 'editor'])) {
    return true;
  }
  return userHasPermission(permissions, [
    'comments.moderate',
    'comments.manage',
    'comments.delete_comment',
    'comments:moderate'
  ]);
};

export const getAuthorRestrictionMessage = (auth, post) => {
  if (!auth || !post) {
    return null;
  }
  if (!isAuthorRoleOnly(auth.roles)) {
    return null;
  }
  const userId = getUserId(auth.user);
  const ownerId = getPostOwnerId(post);
  if (userId && ownerId && userId !== ownerId) {
    return 'Solo la persona autora original puede editar este post.';
  }
  const status = getPostStatus(post);
  if (status && !AUTHOR_ALLOWED_STATUSES.has(status)) {
    return 'Los autores solo pueden editar posts en borrador o en revisión.';
  }
  return null;
};

export default {
  normalizeRoles,
  normalizePermissions,
  userHasRole,
  userHasPermission,
  getUserId,
  getPostOwnerId,
  canCreatePost,
  canAuthorEditPost,
  canEditPost,
  canDeletePost,
  canPublishPost,
  canManageTaxonomies,
  canModerateComments,
  getAuthorRestrictionMessage,
  isAuthorRoleOnly
};
