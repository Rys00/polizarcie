"use server";

import { hasPermission } from "@/lib/permissions";
import { getProfanityGuard } from "@/lib/profanity";
import { prisma } from "@/prisma";
import { forbidden, PoliError, unauthorized } from "@/utils/misc";
import { getCurrentUser } from "@/utils/users";
import { BaseReview, Restaurant, RestaurantReview, User } from "@prisma/client";
import { BaseReviewFull, getBaseReviewById } from "./base-reviews";

export type RestaurantReviewCreator = Pick<
  RestaurantReview,
  "amountSpent" | "content" | "subjectId" | "stars"
>;
export type RestaurantReviewFull = RestaurantReview &
  BaseReviewFull & {
    subject: Restaurant;
  };

const FULL_INCLUDE_PRESET = {
  baseData: {
    include: {
      author: true,
      images: true,
    },
  },
  subject: true,
};

export async function getRestaurantReviewById(
  id: BaseReview["id"]
): Promise<RestaurantReviewFull | null | PoliError> {
  const result = await prisma.restaurantReview.findFirst({
    where: {
      id: id,
    },
    include: FULL_INCLUDE_PRESET,
  });
  if (!result) return result;
  if (result.baseData.hidden) {
    const currentUser = await getCurrentUser();
    if (!currentUser) return unauthorized();
    if (!hasPermission(currentUser, "reviews", "viewHidden", result.baseData))
      return forbidden();
  }
  return result;
}

export async function getRestaurantReviewsByRestaurantId(
  id: Restaurant["id"],
  take: number,
  skip?: number
): Promise<RestaurantReviewFull[]> {
  let result: RestaurantReviewFull[] = [];
  let toTake = take;
  let toSkip = skip || 0;
  const currentUser = (await getCurrentUser()) || undefined;
  if (currentUser) {
    const amountOwn = (
      await prisma.restaurantReview.aggregate({
        where: {
          baseData: {
            authorId: currentUser.id,
          },
        },
        _count: {
          id: true,
        },
      })
    )._count.id;
    if (amountOwn > toSkip) {
      const own = await prisma.restaurantReview.findMany({
        where: {
          subjectId: id,
          baseData: {
            authorId: currentUser.id,
          },
        },
        include: FULL_INCLUDE_PRESET,
        take: toTake,
        skip: toSkip,
        orderBy: [
          {
            baseData: {
              hidden: "asc",
            },
          },
          {
            baseData: {
              createdDate: "desc",
            },
          },
        ],
      });
      result = result.concat(own);
      toTake -= own.length;
      toSkip = 0;
    } else {
      toSkip -= amountOwn;
    }
  }
  toSkip = Math.max(0, toSkip);
  if (toTake > 0) {
    const notOwn = await prisma.restaurantReview.findMany({
      where: {
        subjectId: id,
        baseData: {
          NOT: {
            authorId: currentUser?.id || "",
          },
        },
      },
      include: FULL_INCLUDE_PRESET,
      take: toTake,
      skip: toSkip,
      orderBy: [
        {
          baseData: {
            hidden: "asc",
          },
        },
        {
          baseData: {
            likes: "desc",
          },
        },
      ],
    });
    result = result.concat(notOwn);
  }
  return result.filter(
    (e) =>
      !e.baseData.hidden ||
      hasPermission(currentUser, "reviews", "viewHidden", e.baseData)
  );
}

export async function getRestaurantReviewsByAuthorId(
  id: User["id"],
  take: number,
  skip?: number
): Promise<RestaurantReviewFull[]> {
  const currentUser = (await getCurrentUser()) || undefined;
  const result = await prisma.restaurantReview.findMany({
    where: {
      baseData: {
        authorId: id,
      },
    },
    include: FULL_INCLUDE_PRESET,
    take: take,
    skip: skip,
    orderBy: [
      {
        baseData: {
          hidden: "asc",
        },
      },
      {
        baseData: {
          likes: "desc",
        },
      },
    ],
  });
  return result.filter(
    (e) =>
      !e.baseData.hidden ||
      hasPermission(currentUser, "reviews", "viewHidden", e.baseData)
  );
}

export async function createRestaurantReview(data: RestaurantReviewCreator) {
  const currentUser = await getCurrentUser();
  if (currentUser == null) return unauthorized();
  if (!hasPermission(currentUser, "reviews", "create")) return forbidden();
  const censoredContent = getProfanityGuard().censor(data.content);
  const review = await prisma.baseReview.create({
    data: {
      authorId: currentUser.id,
      restaurantReview: {
        create: {
          subjectId: data.subjectId,
          amountSpent: data.amountSpent,
          content: data.content,
          censoredContent: censoredContent,
          stars: data.stars,
        },
      },
    },
  });
  updateRestaurantStatsCacheById(data.subjectId);
  return review;
}

export async function updateRestaurantReview(data: RestaurantReview) {
  const baseReview = (await getBaseReviewById(data.id)) || undefined;
  if (baseReview instanceof PoliError) return baseReview;
  const currentUser = await getCurrentUser();
  if (currentUser == null) return unauthorized();
  if (!hasPermission(currentUser, "reviews", "edit", baseReview))
    return forbidden();
  const censoredContent = getProfanityGuard().censor(data.content);
  const review = await prisma.restaurantReview.update({
    where: { id: data.id },
    data: {
      amountSpent: data.amountSpent,
      content: data.content,
      censoredContent: censoredContent,
      stars: data.stars,
    },
  });
  updateRestaurantStatsCacheById(data.subjectId);
  return review;
}

export async function updateRestaurantStatsCacheById(id: Restaurant["id"]) {
  const stats = (
    await prisma.restaurantReview.aggregate({
      _avg: {
        amountSpent: true,
        stars: true,
      },
      where: {
        subjectId: id,
      },
    })
  )._avg;
  return await prisma.restaurant.update({
    where: {
      id: id,
    },
    data: {
      averageStars: stats.stars,
      averageAmountSpent: stats.amountSpent,
    },
  });
}
