import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
  }

  const query = `
    query getUserProfile($username: String!) {
      allQuestionsCount {
        difficulty
        count
      }
      matchedUser(username: $username) {
        contributions {
          points
        }
        profile {
          reputation
          ranking
        }
        submissionCalendar
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
      }
      recentSubmissionList(username: $username) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
      }
      matchedUserStats: matchedUser(username: $username) {
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
            __typename
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
            __typename
          }
          __typename
        }
        __typename
      }
    }
  `;

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: `LeetCode API responded with status ${response.status}` }, { status: 502 });
    }

    const result = await response.json();

    if (result.errors) {
      return NextResponse.json({ success: false, error: result.errors[0]?.message || 'GraphQL Error' }, { status: 400 });
    }

    const { allQuestionsCount, matchedUser, recentSubmissionList, matchedUserStats } = result.data || {};

    if (!matchedUser) {
      return NextResponse.json({ success: false, error: 'LeetCode user not found' }, { status: 404 });
    }

    const getCountForDiff = (arr: any[], diff: string) => {
      const item = arr?.find((x: any) => x.difficulty.toLowerCase() === diff.toLowerCase());
      return item ? item.count : 0;
    };

    const totalQuestions = getCountForDiff(allQuestionsCount, 'all');
    const easyQuestions = getCountForDiff(allQuestionsCount, 'easy');
    const mediumQuestions = getCountForDiff(allQuestionsCount, 'medium');
    const hardQuestions = getCountForDiff(allQuestionsCount, 'hard');

    const acStats = matchedUserStats?.submitStats?.acSubmissionNum || matchedUser?.submitStats?.acSubmissionNum || [];
    const totalSolved = getCountForDiff(acStats, 'all');
    const easySolved = getCountForDiff(acStats, 'easy');
    const mediumSolved = getCountForDiff(acStats, 'medium');
    const hardSolved = getCountForDiff(acStats, 'hard');

    const profile = matchedUser.profile || {};
    const ranking = profile.ranking || 0;
    const reputation = profile.reputation || 0;
    const points = matchedUser.contributions?.points || 0;

    return NextResponse.json({
      success: true,
      ranking,
      reputation,
      points,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalQuestions,
      easyQuestions,
      mediumQuestions,
      hardQuestions,
      recentSubmissions: recentSubmissionList || []
    });

  } catch (error: any) {
    console.error('LeetCode proxy error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
