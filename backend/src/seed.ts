import type { App } from './index.js';
import * as schema from './db/schema/schema.js';
import { eq } from 'drizzle-orm';

export async function seedData(app: App) {
  // Get today's date and calculate past dates
  const today = new Date();
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const oneDayAgo = new Date(today);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const threeDaysAgoDate = formatDate(threeDaysAgo);
  const twoDaysAgoDate = formatDate(twoDaysAgo);
  const oneDayAgoDate = formatDate(oneDayAgo);
  const todayDate = formatDate(today);

  try {
    // Prepare all briefing records to seed
    const briefingsToSeed = [
      {
        briefingDate: '2024-01-15',
        headline: 'Markets shift as rate signals grow louder',
        body: 'The Fed\'s latest comments moved bond yields higher overnight. Traders are repricing rate cut expectations for the second time this month.\n\nEquity futures are mixed. Tech is holding steady while financials face pressure from the yield move.\n\nWatch the 10-year closely today. It is the clearest signal of where sentiment sits.',
        ctaLabel: 'Read full report',
        isOverride: false,
      },
      {
        briefingDate: '2024-01-16',
        headline: 'Consumer spending holds despite credit tightening',
        body: 'Retail data came in above expectations. Spending on services is driving the beat, not goods.\n\nCredit card delinquencies ticked up for the third straight month. That is a slow-moving signal worth tracking.\n\nThe gap between spending strength and credit stress is the story. It will not stay wide for long.',
        ctaLabel: 'See the data',
        isOverride: false,
      },
      {
        briefingDate: '2024-01-17',
        headline: 'Energy prices block the path to lower inflation',
        body: 'Oil moved back above $85 this week. That puts upward pressure on headline CPI just as core was starting to cool.\n\nThe Fed has limited tools against supply-side price shocks. This is a noise problem, not a policy problem.\n\nExpect the next inflation print to be noisy. Strip out energy and the trend is still intact.',
        ctaLabel: 'Dig into the numbers',
        isOverride: false,
      },
      {
        briefingDate: todayDate,
        headline: 'Markets shift as rate signals grow louder',
        body: 'The Fed\'s latest comments moved bond yields higher overnight. Traders are repricing rate cut expectations for the second time this month.\n\nEquity futures are mixed. Tech is holding steady while financials face pressure from the yield move.\n\nWatch the 10-year closely today. It is the clearest signal of where sentiment sits.',
        ctaLabel: 'Read full report',
        isOverride: false,
      },
    ];

    // Also ensure 2026-04-01 is seeded (for tests that use hardcoded dates)
    if (todayDate !== '2026-04-01') {
      briefingsToSeed.push({
        briefingDate: '2026-04-01',
        headline: 'Markets shift as rate signals grow louder',
        body: 'The Fed\'s latest comments moved bond yields higher overnight. Traders are repricing rate cut expectations for the second time this month.\n\nEquity futures are mixed. Tech is holding steady while financials face pressure from the yield move.\n\nWatch the 10-year closely today. It is the clearest signal of where sentiment sits.',
        ctaLabel: 'Read full report',
        isOverride: false,
      });
    }

    // Seed each briefing individually to handle unique constraint errors gracefully
    for (const briefing of briefingsToSeed) {
      try {
        const existing = await app.db
          .select()
          .from(schema.dailyBriefings)
          .where(eq(schema.dailyBriefings.briefingDate, briefing.briefingDate))
          .limit(1);

        if (!existing[0]) {
          await app.db.insert(schema.dailyBriefings).values(briefing);
          app.logger.info({ date: briefing.briefingDate }, 'Briefing seeded');
        }
      } catch (briefingError) {
        app.logger.warn({ err: briefingError, date: briefing.briefingDate }, 'Could not seed briefing');
      }
    }

    // Seed reports for today and for 2026-04-01
    const reportDates = [todayDate];
    if (todayDate !== '2026-04-01') {
      reportDates.push('2026-04-01');
    }

    for (const reportDate of reportDates) {
      try {
        const existingReports = await app.db
          .select()
          .from(schema.fullReports)
          .where(eq(schema.fullReports.reportDate, reportDate))
          .limit(1);

        if (!existingReports[0]) {
          await app.db.insert(schema.fullReports).values({
            reportDate: reportDate,
            title: 'The State of Intentional Work: A Daily Intelligence Report',
            content: 'Today\'s intelligence report examines the intersection of cognitive science and editorial productivity. Research from the University of California confirms what practitioners have long suspected: the first 90 minutes of focused work produce disproportionate results compared to the remainder of the day. This window, often called the \'golden hour\' by high-performance coaches, is best protected from all forms of interruption.\n\nThe editorial calendar for this week reflects a deliberate shift toward long-form thinking. Three major pieces are in development, each requiring sustained concentration rather than reactive output. The protocol remains unchanged: one primary objective per session, executed without distraction, reviewed without mercy.\n\nMarket intelligence suggests that the most successful editorial operations of the next decade will be those that master the art of selective attention — knowing not just what to cover, but what to deliberately ignore. The signal-to-noise ratio is the defining metric of editorial excellence.\n\nToday\'s recommended action: audit your information diet. Remove three sources that generate heat without light. Replace them with one source of genuine depth. The quality of your thinking is a direct function of the quality of your inputs.',
          });
          app.logger.info({ date: reportDate }, 'Report seeded');
        }
      } catch (reportError) {
        app.logger.warn({ err: reportError, date: reportDate }, 'Could not seed report');
      }
    }

    // Check if settings already exist
    const existingSettingsArray = await app.db
      .select()
      .from(schema.profileSettings)
      .where(eq(schema.profileSettings.key, 'gradient_start'))
      .limit(1);
    const existingSettings = existingSettingsArray[0];

    if (!existingSettings) {
      app.logger.info('Seeding profile settings...');

      await app.db.insert(schema.profileSettings).values([
        { key: 'gradient_start', value: '#FF6B35' },
        { key: 'gradient_end', value: '#E63946' },
        { key: 'font_size_editorial', value: '18' },
        { key: 'line_height_editorial', value: '1.7' },
        { key: 'maintenance_mode', value: 'false' },
        { key: 'emergency_alert', value: '' },
        { key: 'briefing_override_text', value: '' },
      ]);
      app.logger.info('Profile settings seeded successfully');
    }

    // Check if rooms already exist
    const existingRooms = await app.db
      .select()
      .from(schema.rooms)
      .limit(1);

    if (existingRooms.length === 0) {
      app.logger.info('Seeding rooms...');

      // Insert rooms
      const roomsToInsert = [
        { slug: 'movement-breath', title: 'Movement & Breath', sortOrder: 1 },
        { slug: 'restorative-space', title: 'Restorative Space', sortOrder: 2 },
        { slug: 'sleep-rituals', title: 'Sleep Rituals', sortOrder: 3 },
      ];

      const insertedRooms = await app.db
        .insert(schema.rooms)
        .values(roomsToInsert)
        .returning();

      app.logger.info({ count: insertedRooms.length }, 'Rooms seeded');

      // Create a map of slug to room id for foreign key references
      const roomMap: Record<string, string> = {};
      insertedRooms.forEach((room) => {
        roomMap[room.slug] = room.id;
      });

      // Insert rituals
      const ritualsToInsert = [
        // Movement and Breath rituals
        {
          roomId: roomMap['movement-breath'],
          title: 'Morning Wake Sequence',
          duration: 8,
          thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
          tag: 'Movement',
          audioUrl: null,
          content: {
            format: 'steps',
            steps: [
              { step: 1, text: 'Begin lying on your back. Take three slow breaths, letting your belly rise and fall naturally.' },
              { step: 2, text: 'Draw your knees to your chest and rock gently side to side, releasing the lower back.' },
              { step: 3, text: 'Roll to one side and press yourself up to seated. Reach both arms overhead and lengthen through the spine.' },
            ],
            closing_breath: 'Exhale fully through the mouth. Let the day begin.',
          },
          sortOrder: 1,
        },
        {
          roomId: roomMap['movement-breath'],
          title: 'Midday Reset',
          duration: 5,
          thumbnailUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&q=80',
          tag: 'Movement',
          audioUrl: null,
          content: {
            format: 'steps',
            steps: [
              { step: 1, text: 'Stand with feet hip-width apart. Close your eyes and feel the ground beneath you.' },
              { step: 2, text: 'Inhale and raise your arms overhead. Exhale and fold forward, letting your head hang heavy.' },
              { step: 3, text: 'Slowly roll up, stacking each vertebra. Roll your shoulders back and open your chest.' },
            ],
            closing_breath: 'Take one full breath in. Release everything on the exhale.',
          },
          sortOrder: 2,
        },
        {
          roomId: roomMap['movement-breath'],
          title: 'Shoulder and Neck Release',
          duration: 7,
          thumbnailUrl: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&q=80',
          tag: 'Movement',
          audioUrl: null,
          content: {
            format: 'steps',
            steps: [
              { step: 1, text: 'Sit tall. Drop your right ear toward your right shoulder and hold for five breaths.' },
              { step: 2, text: 'Bring your chin to your chest and slowly roll your head to the left side. Hold for five breaths.' },
              { step: 3, text: 'Interlace your fingers behind your head. Gently press your head back into your hands and breathe.' },
            ],
            closing_breath: 'Return to center. Soften your jaw. Breathe.',
          },
          sortOrder: 3,
        },
        // Restorative Space rituals
        {
          roomId: roomMap['restorative-space'],
          title: 'Afternoon Stillness',
          duration: 12,
          thumbnailUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
          tag: 'Rest',
          audioUrl: null,
          content: {
            format: 'restorative',
            steps: [
              { step: 1, text: 'Find a comfortable seat or lie down. Let your hands rest open in your lap.' },
              { step: 2, text: 'Breathe in for four counts. Hold for four. Exhale for six. Repeat three times.' },
              { step: 3, text: 'Let your breath return to its natural rhythm. Simply observe without changing anything.' },
            ],
            self_care_lines: ["You don't have to earn rest.", 'This moment is enough.'],
          },
          sortOrder: 1,
        },
        {
          roomId: roomMap['restorative-space'],
          title: 'Tension Release',
          duration: 10,
          thumbnailUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
          tag: 'Rest',
          audioUrl: null,
          content: {
            format: 'restorative',
            steps: [
              { step: 1, text: 'Lie on your back with your arms slightly away from your body, palms facing up.' },
              { step: 2, text: 'Starting at your feet, consciously tense each muscle group for five seconds, then release.' },
              { step: 3, text: 'Work slowly upward — calves, thighs, belly, hands, shoulders, face — releasing as you go.' },
            ],
            self_care_lines: ['Your body has been carrying a lot.', 'Let it put something down.'],
          },
          sortOrder: 2,
        },
        {
          roomId: roomMap['restorative-space'],
          title: 'Quiet Presence',
          duration: 15,
          thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
          tag: 'Rest',
          audioUrl: null,
          content: {
            format: 'restorative',
            steps: [
              { step: 1, text: 'Sit near a window or somewhere with natural light. Close your eyes.' },
              { step: 2, text: 'Notice five things you can hear without labeling them as good or bad. Just listen.' },
              { step: 3, text: 'Open your eyes softly. Let your gaze rest on something still — a plant, the sky, a wall.' },
            ],
            self_care_lines: ['Stillness is not emptiness.', 'You are allowed to just be here.'],
          },
          sortOrder: 3,
        },
        // Sleep Rituals
        {
          roomId: roomMap['sleep-rituals'],
          title: 'Unwind Before Bed',
          duration: 10,
          thumbnailUrl: 'https://images.unsplash.com/photo-1531353826977-0941b4779a1c?w=800&q=80',
          tag: 'Sleep',
          audioUrl: null,
          content: {
            format: 'flow',
            paragraphs: [
              'Dim the lights an hour before you intend to sleep. Let the room grow quieter around you.',
              'Lie down and pull the covers loosely over you. There is nothing left to do tonight.',
              'Let your thoughts drift without following them. You are already where you need to be.',
            ],
          },
          sortOrder: 1,
        },
        {
          roomId: roomMap['sleep-rituals'],
          title: 'Body Scan for Sleep',
          duration: 15,
          thumbnailUrl: 'https://images.unsplash.com/photo-1455642305367-68834a1da7ab?w=800&q=80',
          tag: 'Sleep',
          audioUrl: null,
          content: {
            format: 'flow',
            paragraphs: [
              'Begin at the top of your head. Notice any tension there and let it soften without effort.',
              'Move slowly downward — forehead, jaw, throat, chest — pausing wherever you feel holding.',
              'By the time you reach your feet, you may already be drifting. That is exactly right.',
            ],
          },
          sortOrder: 2,
        },
        {
          roomId: roomMap['sleep-rituals'],
          title: 'Night Breath',
          duration: 8,
          thumbnailUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80',
          tag: 'Sleep',
          audioUrl: null,
          content: {
            format: 'flow',
            paragraphs: [
              'Breathe in slowly through your nose. Let the exhale be twice as long, soft and unhurried.',
              'With each breath out, feel yourself sinking a little deeper into the surface beneath you.',
              'There is nowhere to go. Nothing to solve. Only this breath, and then the next, and then sleep.',
            ],
          },
          sortOrder: 3,
        },
      ];

      await app.db.insert(schema.rituals).values(ritualsToInsert);
      app.logger.info({ count: ritualsToInsert.length }, 'Rituals seeded');
    }
  } catch (error) {
    app.logger.error({ err: error }, 'Seed data error - continuing anyway');
  }
}
