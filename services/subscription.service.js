import db from '../utils/db.js';

export default {
    async subscribe(userId, durationMinutes = 7 * 24 * 60) {
        const now = new Date();
        const validUntil = new Date(now.getTime() + durationMinutes * 60 * 1000);

        await db('subscriptions').insert({
            user_id: userId,
            valid_until: validUntil,
        });

        return validUntil;
    },

    async extendSubscription(userId, durationMinutes = 7 * 24 * 60) {
        const subscription = await db('subscriptions')
            .select('valid_until')
            .where('user_id', userId)
            .first();

        const currentValidUntil = subscription?.valid_until
            ? new Date(subscription.valid_until)
            : new Date();

        const extendedValidUntil = new Date(currentValidUntil.getTime() + durationMinutes * 60 * 1000);

        if (subscription) {
            await db('subscriptions')
                .where('user_id', userId)
                .update({
                    valid_until: extendedValidUntil,
                });
        } else {
            await db('subscriptions').insert({
                user_id: userId,
                valid_until: extendedValidUntil,
            });
        }

        return extendedValidUntil;
    },

    async unsubscribe(userId) {
        await db('subscriptions').where('user_id', userId).del();
    },

    async getSubscriptionStatus(userId) {
        const subscription = await db('subscriptions')
            .select('valid_until')
            .where('user_id', userId)
            .first();

        if (!subscription || !subscription.valid_until) {
            return false;
        }

        const now = new Date();
        const validUntil = new Date(subscription.valid_until);

        return validUntil > now; // True if subscription is valid
    }
};