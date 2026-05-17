import { api } from '@/src/lib/api';
import { filterListByCourseId } from '@/src/lib/filter-by-course-id';
import type { SocialLink, CreateSocialLinkRequest } from '@/src/types';
import { createQueryHook, createMutationHook } from './index';

// ============================================
// Social Links Hooks
// ============================================

export const useSocialLinks = createQueryHook<SocialLink[], [number | null]>(
  (courseId) =>
    api.socialLinks.list().then((res) =>
      filterListByCourseId(res.data, courseId, (link) => link.attributes.course_id),
    ),
);

export const useSocialLink = createQueryHook(
  (id: number) => api.socialLinks.get(id).then(res => res.data)
);

export const useCreateSocialLink = createMutationHook(
  (data: CreateSocialLinkRequest) => api.socialLinks.create(data).then(res => res.data)
);

export const useUpdateSocialLink = createMutationHook(
  (id: number, data: Partial<CreateSocialLinkRequest>) =>
    api.socialLinks.update(id, data).then(res => res.data)
);

export const useDeleteSocialLink = createMutationHook(
  (id: number) => api.socialLinks.delete(id).then(res => res.data)
);
