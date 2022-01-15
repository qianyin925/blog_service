import remove from '#service/common/remove';
import getList from '#service/common/getList';

/**
 * 根据 payload 数组删除图片
 */
export default async ({ ctx, payload }) => {
  const data = await getList({
    ctx,
    model: 'Photo',
    search: { payload: payload.filter((v) => v) },
  });
  await remove({
    ctx,
    model: 'Photo',
    conds: { ids: data.list.map((v) => v.id) },
  });
};
