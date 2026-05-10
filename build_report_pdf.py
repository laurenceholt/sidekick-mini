"""Build the Sidekick-mini usage analysis PDF report."""
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether,
)

OUT = "sidekick-mini-analysis-2026-04-23.pdf"

styles = getSampleStyleSheet()
# Tune body style
styles['Normal'].fontSize = 10
styles['Normal'].leading = 13
styles['Heading1'].spaceBefore = 14
styles['Heading1'].spaceAfter = 6
styles['Heading2'].spaceBefore = 10
styles['Heading2'].spaceAfter = 4
styles['Heading3'].spaceBefore = 8
styles['Heading3'].spaceAfter = 3

BODY = styles['Normal']
H1 = styles['Heading1']
H2 = styles['Heading2']
H3 = styles['Heading3']
TITLE = styles['Title']

SMALL = ParagraphStyle('small', parent=BODY, fontSize=9, leading=11)
QUOTE = ParagraphStyle('quote', parent=BODY, fontSize=9.5, leading=12,
                       leftIndent=14, rightIndent=14, textColor=colors.HexColor('#333333'),
                       fontName='Helvetica-Oblique')

def P(text, style=BODY):
    return Paragraph(text, style)

def make_table(data, col_widths=None, header=True):
    t = Table(data, colWidths=col_widths, hAlign='LEFT')
    style = [
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.25, colors.HexColor('#bbbbbb')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]
    if header:
        style += [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e8eef5')),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ]
    t.setStyle(TableStyle(style))
    return t

story = []

# ---- TITLE ----
story.append(P("Sidekick-mini usage analysis", TITLE))
story.append(P("Student progress export &mdash; 2026-04-23", SMALL))
story.append(Spacer(1, 10))
story.append(P(
    "Analysis of <b>23,880 step responses</b> from <b>215 students</b> across <b>6 mini-lessons</b> "
    "(14 questions / 142 steps), after filtering out preview/archived rows.", BODY))
story.append(Spacer(1, 4))

# ---- HEADLINE ----
story.append(P("Headline numbers", H1))
story.append(make_table([
    ['Metric', 'Value'],
    ['Overall first-try-correct (FTC)', '73.2%'],
    ['Average attempts per step', '1.64'],
    ['Step-level replay rate', '25.7%'],
    ['Unique students', '215'],
    ['Unique mini-lessons', '6'],
    ['Unique questions (KCs)', '14'],
    ['Unique steps', '142'],
], col_widths=[2.6*inch, 1.3*inch]))

# ---- LESSON RANKING ----
story.append(P("Lesson ranking (hardest &rarr; easiest)", H1))
story.append(make_table([
    ['Lesson', 'FTC', 'Avg attempts', 'Replay rate'],
    ['L9 Intro to Inequalities', '68.1%', '1.92', '30.6%'],
    ['L6 Absolute Value', '70.5%', '1.39', '27.6%'],
    ['L2 Points on the Number Line', '71.2%', '1.94', '27.2%'],
    ['L3 Comparing +/\u2212', '75.0%', '1.47', '24.0%'],
    ['L1 Positive and Negative', '76.2%', '1.41', '23.3%'],
    ['L11 Coordinate Plane', '76.6%', '1.67', '22.5%'],
], col_widths=[3.1*inch, 0.8*inch, 1.0*inch, 1.0*inch]))
story.append(Spacer(1, 6))
story.append(P(
    "<b>L9 (Inequalities) is the clear outlier</b> &mdash; hardest by every metric and the "
    "only lesson with replay rate above 30%.", BODY))

# FTC bar chart
try:
    img = Image('lesson_ftc.png', width=6.2*inch, height=3.1*inch)
    story.append(Spacer(1, 6))
    story.append(img)
except Exception:
    pass

story.append(PageBreak())

# ---- PROBLEM STEPS ----
story.append(P("Conceptually hardest steps", H1))
story.append(P(
    "Steps where students hit a wall &mdash; low first-try-correct plus elevated attempts "
    "across most of the class, not just a tail.", BODY))
story.append(Spacer(1, 4))
story.append(make_table([
    ['Lesson / KC', 'Step', 'FTC', 'Avg att.'],
    ['L9 Graphing inequalities', 'step-7', '20.8%', '5.17'],
    ['L9 Graphing inequalities', 'step-9', '31.8%', '3.69'],
    ['L9 Inequality solutions',  'step-8', '34.4%', '3.96'],
    ['L6 Absolute Value',        'step-3', '34.4%', '1.67'],
    ['L1 Negative numbers',      'step-7', '36.2%', '2.61'],
    ['L11 Finding points on grid','step-1', '41.1%', '2.93'],
    ['L2 Opposites',             'step-5', '42.2%', '2.95'],
    ['L6 Absolute Value',        'step-9', '43.3%', '1.57'],
    ['L2 Decimals',              'step-0', '44.1%', '4.48'],
    ['L1 Comparing integers',    'step-6', '44.5%', '2.37'],
    ['L3 > and < symbols',       'step-8', '46.0%', '3.12'],
], col_widths=[3.0*inch, 0.8*inch, 0.7*inch, 0.9*inch]))

# ---- UI FRICTION ----
story.append(P("Likely UI / input friction", H1))
story.append(P(
    "Steps where max attempts explodes despite moderate-to-high FTC. p90 stays small &mdash; "
    "this is individual sessions stuck in a broken state, not broad failure. Worth replaying "
    "these sessions to see what the interaction did.", BODY))
story.append(Spacer(1, 4))
story.append(make_table([
    ['Step', 'FTC', 'Avg', 'p90', 'Max attempts'],
    ['L11 Finding points on grid \u00b7 step-4', '77.9%', '3.45', '2.0', '199'],
    ['L2 Decimals \u00b7 step-1',                '71.6%', '2.68', '4.0', '121'],
    ['L11 Distance planes \u00b7 step-1',        '79.7%', '2.68', '2.0', '90'],
    ['L2 Decimals \u00b7 step-3',                '55.7%', '3.74', '7.0', '88'],
    ['L3 >/< symbols \u00b7 step-8',             '46.0%', '3.12', '5.0', '81'],
    ['L9 Graphing ineq. \u00b7 step-4',          '93.6%', '1.55', '1.0', '81'],
    ['L3 Comparing integers \u00b7 step-5',      '62.7%', '3.65', '8.0', '74'],
    ['L2 Decimals \u00b7 step-0',                '44.1%', '4.48', '11.0', '71'],
], col_widths=[2.9*inch, 0.7*inch, 0.6*inch, 0.6*inch, 1.0*inch]))

story.append(PageBreak())

# ---- Q1 ----
story.append(P("Q1. How exactly did I verify that students finish all steps?", H1))
story.append(P(
    "Each <code>response_id</code> is one student's single play-through of one question, "
    "with one row per <code>step_key</code> (typically 10 rows, 0\u20139). Counting distinct "
    "<code>response_id</code>s at each step within a question, the count is identical for "
    "step-0 and step-9 in every question. So <b>once a student opens a question, they reach "
    "all of its steps</b> &mdash; no mid-question drop-off.",
    BODY))
story.append(P(
    "But that says nothing about whether students complete every question in a mini-lesson. "
    "The true cross-question completion rates:", BODY))
story.append(Spacer(1, 3))
story.append(make_table([
    ['Mini-lesson', 'Questions', 'Students', 'Completed all Qs'],
    ['L1 Positive/Negative', '3', '213', '98.6%'],
    ['L2 Points on NL', '2', '209', '97.6%'],
    ['L3 Comparing', '2', '203', '98.5%'],
    ['L6 Absolute Value', '1', '195', '100%'],
    ['L9 Inequalities', '3', '173', '75.7% \u26a0'],
    ['L11 Coord Plane', '3', '95', '72.6% \u26a0'],
], col_widths=[2.5*inch, 0.9*inch, 0.9*inch, 1.3*inch]))
story.append(Spacer(1, 4))
story.append(P(
    "<b>Honest version:</b> within a question, no mid-question drop-off. Between questions "
    "in L9 and L11, about a quarter of students never started the later questions &mdash; "
    "consistent with L9 being the hardest lesson and L11 being the most recently released.",
    BODY))

# ---- Q2 ----
story.append(P("Q2. Can we see end-of-lesson reassessment results?", H1))
story.append(P(
    "Partially. After re-examining the schema, <code>first_try_correct</code> and "
    "<code>replayed</code> are near-perfectly anti-correlated (r = &minus;0.999):", BODY))
story.append(Spacer(1, 3))
story.append(make_table([
    ['Case', 'Rows', 'Interpretation'],
    ['ftc=1, replayed=0', '17,447', 'Right first try; no replay needed (attempts=1)'],
    ['ftc=0, replayed=1', '6,159',  'Wrong first try; re-asked at end of lesson'],
    ['ftc=0, replayed=0', '269',    'Session likely ended before replay'],
    ['ftc=1, replayed=1', '5',      'Edge cases'],
], col_widths=[1.8*inch, 0.8*inch, 3.1*inch]))
story.append(Spacer(1, 4))
story.append(P(
    "So <code>replayed=t</code> marks the rows where a student missed first time and got "
    "the end-of-lesson reassessment. <code>attempts</code> counts total tries across "
    "all phases. Every step eventually gets answered (we saw no mid-question drop-off), "
    "so all 6,159 replayed rows were eventually answered correctly. The question is how "
    "painfully:", BODY))
story.append(Spacer(1, 3))
story.append(make_table([
    ['Total attempts on missed-then-replayed steps', 'Count', 'Share'],
    ['2 (wrong once, right once)', '4,334', '70.3%'],
    ['3', '651', '10.6%'],
    ['4', '328', '5.3%'],
    ['5\u20139', '583', '9.5%'],
    ['10+', '263', '4.3%'],
], col_widths=[3.4*inch, 0.8*inch, 0.7*inch]))
story.append(Spacer(1, 4))
story.append(P(
    "<b>Take:</b> of the students who got a step wrong on first try, about <b>70% "
    "turned it around with one additional correct attempt</b> (most likely the end-of-lesson "
    "reassessment). About 15% needed 4+ total tries. Strong evidence that the reassess-at-end "
    "mechanic is doing real work.", BODY))
story.append(P(
    "<b>Caveat:</b> I can't distinguish the immediate retry from the end-of-lesson retry "
    "&mdash; both are lumped into <code>attempts</code>. To separate them you'd need the "
    "backend event log.", BODY))

story.append(PageBreak())

# ---- Q3 ----
story.append(P("Q3. Explaining &ldquo;max attempts&rdquo;", H1))
story.append(P(
    "<code>attempts</code> is the total number of tries a single student made on one step. "
    "<code>max_attempts</code> is the maximum across all students who did that step. The key "
    "diagnostic is the gap between p90 and max:", BODY))
story.append(Spacer(1, 3))
def wrap(text):
    return Paragraph(text, SMALL)
story.append(make_table([
    ['Step', 'Avg', 'p90', 'Max', 'Diagnostic'],
    ['L11 Finding points \u00b7 step-4', '3.45', '2', '199',
     wrap('90% did it in \u22642. One student: 199. Almost certainly a UI lockup or mass-click.')],
    ['L2 Decimals \u00b7 step-1', '2.68', '4', '121',
     wrap('Noticeable tail AND one outlier \u2014 UI friction plus a few stuck students.')],
    ['L2 Decimals \u00b7 step-0', '4.48', '11', '71',
     wrap('p90=11: many students took \u226510 tries. Conceptually hard, not just one outlier.')],
    ['L9 Graphing \u00b7 step-4', '1.55', '1', '81',
     wrap('90% first try. One student: 81. Pure outlier \u2014 browser/input glitch.')],
], col_widths=[1.7*inch, 0.5*inch, 0.5*inch, 0.5*inch, 3.3*inch]))
story.append(Spacer(1, 4))
story.append(P(
    "So &ldquo;199 max attempts on coord plane step-4&rdquo; doesn't mean students fail it broadly "
    "(77.9% get it first try). It means <b>one individual spent ages clicking</b> &mdash; strong "
    "smell of an unresponsive interaction or a validator rejecting valid-looking answers. Worth "
    "logging clicks on those steps and replaying sessions.", BODY))
story.append(P(
    "Where avg + p90 + max are all high (L2 Decimals step-0: 4.48 / 11 / 71), that's the worst "
    "case: conceptually hard <b>and</b> UI-friction-y.", BODY))

# ---- Q4 ----
story.append(P("Q4. Correlation between lessons", H1))
story.append(P(
    "Student-level first-try-correct across pairs of mini-lessons. Pairwise: only students "
    "who did both lessons.", BODY))
try:
    img = Image('lesson_correlation.png', width=5.8*inch, height=4.6*inch)
    story.append(Spacer(1, 4))
    story.append(img)
except Exception:
    pass
story.append(P(
    "Most pairs correlate 0.5\u20130.7 &mdash; the expected &ldquo;some kids are stronger overall&rdquo; "
    "pattern. <b>L6 Absolute Value is the exception: 0.23\u20130.38 with every other lesson.</b> "
    "That's meaningfully lower &mdash; see Q6.", BODY))

story.append(PageBreak())

# ---- Q5 ----
story.append(P("Q5. Top-offender steps: content + hypotheses", H1))

story.append(P("L9 &ldquo;Graphing inequalities&rdquo; step-7 &mdash; 21% FTC, avg 5.17 attempts", H3))
story.append(P(
    "<i>&ldquo;The reactor will melt down if the core temperature rises above 3&deg;. Write an "
    "inequality for that. Choose a letter to represent the temperature.&rdquo;</i><br/>"
    "UI: [type variable] [&lt;/&gt;/= dropdown] [type number]. Target: t &gt; 3 but any variable accepted.",
    QUOTE))
story.append(P(
    "<b>Hypothesis:</b> This is the <i>first</i> step that asks students to pick their own variable "
    "name. Nothing earlier taught them &ldquo;any letter works&rdquo; for the variable box. They "
    "likely type nothing / &ldquo;x&rdquo; / &ldquo;temperature&rdquo; and hit errors. The answer "
    "space is combinatorial (variable &times; symbol &times; number), so noise is high.<br/>"
    "<b>Fix:</b> either pre-fill the variable (e.g. &ldquo;t&rdquo;) or add an inline tutorial on "
    "the first open-variable step. Hint should spell out: &ldquo;Type any letter &mdash; 't' works "
    "well for temperature.&rdquo;", BODY))

story.append(P("L9 &ldquo;Graphing&rdquo; step-9 &mdash; 32% FTC", H3))
story.append(P(
    "<i>&ldquo;A sign on Math Highway reads 's &lt; 65 mph'. What do you think it means?&rdquo;</i><br/>"
    "MC: &ldquo;Your speed must be less than 65 mph&rdquo; vs &ldquo;more than 65 mph&rdquo;.",
    QUOTE))
story.append(P(
    "<b>Hypothesis:</b> On a 2-choice MC, 32% FTC is worse than random. Students are systematically "
    "reading &lt; as &ldquo;greater than.&rdquo; That's a direction-reversal error &mdash; likely "
    "because in the preceding screens students were <i>building</i> inequalities by picking an arrow "
    "direction; here they have to <i>read</i> a symbol cold, and nothing in the prior steps drills "
    "&ldquo;&lt; means less.&rdquo;<br/>"
    "<b>Fix:</b> add an interpretation step right before this one: &ldquo;Remember, the open side "
    "of &lt; faces the bigger number.&rdquo;", BODY))

story.append(P("L9 &ldquo;Inequality solutions&rdquo; step-8 &mdash; 34% FTC, avg 3.96 attempts", H3))
story.append(P(
    "<i>&ldquo;Write an inequality for which 7, 15, and 33 are solutions.&rdquo;</i><br/>"
    "UI: type variable + pick symbol + type number. Target: n &gt; 6 or equivalent.",
    QUOTE))
story.append(P(
    "<b>Hypothesis:</b> First fully open-ended &ldquo;construct-an-inequality&rdquo; task. Students "
    "have been picking from choices or filling one slot &mdash; this demands three correct decisions "
    "with no scaffolding. Many-valid-answers validator can also be a trap (does x &gt; 5 work? "
    "n &ge; 7?).<br/>"
    "<b>Fix:</b> break into two steps &mdash; first &ldquo;pick &gt; or &lt;&rdquo;, then &ldquo;pick "
    "a cutoff number that's smaller than 7.&rdquo; Or stage with the variable pre-filled.", BODY))

story.append(P("L6 &ldquo;Absolute value&rdquo; step-3 &mdash; 34% FTC", H3))
story.append(P(
    "<i>&ldquo;What is the absolute value of <b>4</b>?&rdquo;</i><br/>"
    "MC: 4 (correct) vs &minus;4.",
    QUOTE))
story.append(P(
    "<b>Hypothesis:</b> The weirdest result in the dataset. Step-2 just before it asks &ldquo;absolute "
    "value of &minus;4&rdquo; (answer: 4) and gets ~72% FTC. Then step-3 asks &ldquo;absolute value "
    "of 4&rdquo; and 66% of students pick &minus;4. They've overgeneralized the rule they just "
    "&ldquo;learned&rdquo; from step-2 &mdash; &ldquo;absolute value flips the sign&rdquo; &mdash; "
    "and now confidently flip positive to negative.<br/>"
    "<b>Fix:</b> after step-2, insert an explicit framing: &ldquo;Absolute value is always the "
    "<i>distance</i>, so it's never negative&rdquo; BEFORE the |4| = ? item. Textbook case of a "
    "worked example teaching a wrong rule.", BODY))

story.append(P("L2 &ldquo;Decimals on the number line&rdquo; step-0 &mdash; 44% FTC, avg 4.48, max 71", H3))
story.append(P(
    "<i>&ldquo;Here is 2.5. Plot 2.1. (Each tick is a tenth: 0.1.)&rdquo;</i><br/>"
    "Range &minus;3 to 3, tickStep 0.1, labelStep 1 (only integers labeled).",
    QUOTE))
story.append(P(
    "<b>Hypothesis:</b> Two compounding issues. (1) With tickStep 0.1 on a range of 6, there are "
    "60 ticks; at phone/Chromebook widths they may be near-invisible or too close to click "
    "precisely. (2) Students see &ldquo;2.5&rdquo; labeled and have to count backwards by tenths "
    "without a &ldquo;2&rdquo; label anywhere nearby. Many probably put 2.1 somewhere near 2.5.<br/>"
    "<b>Fix:</b> add labels at each unit visible on screen AND give the reference &ldquo;2&rdquo; "
    "a label, not just 2.5. Consider a click-snap to nearest tenth.", BODY))

story.append(P("L1 &ldquo;Negative numbers&rdquo; step-7 &mdash; 36% FTC, avg 2.61", H3))
story.append(P(
    "<i>&ldquo;Add 2 to this point. Move it to where it should be.&rdquo;</i><br/>"
    "Type: move-point. Starts at &minus;3 (carried from step-6), target &minus;1.",
    QUOTE))
story.append(P(
    "<b>Hypothesis:</b> First time in the product the interaction is &ldquo;move an existing point "
    "by an arithmetic operation&rdquo; rather than &ldquo;plot a new point.&rdquo; Students may "
    "(a) try to add a new point instead of dragging the existing one, (b) move it left (subtract) "
    "because of &ldquo;adding a negative to a negative&rdquo;-style confusion.<br/>"
    "<b>Fix:</b> change the instruction to make the interaction mode explicit: &ldquo;<b>Drag</b> "
    "this point 2 to the right (adding 2).&rdquo; The word &ldquo;move&rdquo; underplays that "
    "this is a new interaction type.", BODY))

story.append(PageBreak())

# ---- Q6 ----
story.append(P("Q6. Why L6 tests something its prerequisites don't prepare for", H1))
story.append(P(
    "L6's concept graph looks right on paper: negatives (L1) &rarr; number-line comparison "
    "(L2, L3) &rarr; absolute value (L6). But the actual step flow reveals a mismatch.", BODY))
story.append(P(
    "<b>Everything before L6 teaches: signs matter, direction matters, bigger-negative-is-smaller.</b> "
    "L6 then asks students to <b>ignore the sign</b> and answer about <i>distance</i>. "
    "That's the opposite mental move.", BODY))
story.append(P("The two cliff steps:", H3))
story.append(P(
    "<b>Step-3: &ldquo;|4| = ?&rdquo; (34% FTC).</b> The prerequisite lessons have drilled "
    "&ldquo;negatives flip to positives and vice versa&rdquo; (L2 Opposites: &ldquo;What's the "
    "opposite of &minus;4?&rdquo; &rarr; 4). Step-2 of L6 then asks &ldquo;|&minus;4| = ?&rdquo; "
    "(answer 4) &mdash; which <i>looks identical</i> to an &ldquo;opposites&rdquo; problem from "
    "L2. So when step-3 asks &ldquo;|4|?&rdquo;, students apply the L2 opposites rule and answer "
    "<b>&minus;4</b>. The lesson has taught absolute value via an example that's indistinguishable "
    "from &ldquo;take the opposite.&rdquo;", BODY))
story.append(P(
    "<b>Step-9: &ldquo;opposites can have different absolute values &mdash; agree/disagree?&rdquo; "
    "(43% FTC).</b> The negative framing (&ldquo;can... can never&rdquo;) combined with the "
    "concept-bridge back to L2 opposites means students have to hold two ideas at once "
    "(opposites = mirror image, absolute value = distance) and see they're compatible. "
    "Nothing earlier demands that synthesis.", BODY))
story.append(P(
    "<b>So the low correlation with L1/L2/L3 (r &asymp; 0.25&ndash;0.38) is real:</b> students who "
    "mastered &ldquo;plot &minus;4,&rdquo; &ldquo;is &minus;5 less than &minus;3?&rdquo;, "
    "&ldquo;opposite of 7?&rdquo; are not necessarily the ones who grasp &ldquo;distance from zero "
    "is always positive.&rdquo; L6 tests a <b>conceptually orthogonal</b> skill (magnitude vs signed "
    "value) that the prerequisites never directly set up.", BODY))
story.append(P("Fix:", H3))
story.append(P(
    "1. Insert a dedicated bridging mini-lesson: &ldquo;how far is each number from 0?&rdquo; "
    "(using only positive answers, no sign talk) <i>before</i> introducing the word &ldquo;absolute "
    "value.&rdquo;<br/>"
    "2. Re-sequence step-3 to come <i>before</i> step-2, so students meet &ldquo;|4|=4&rdquo; "
    "(trivial) before &ldquo;|&minus;4|=4&rdquo; (the interesting case), not the reverse.", BODY))

# Footer
story.append(Spacer(1, 12))
story.append(P(
    "<i>Analysis based on sidekick-mini-progress-2026-04-23.csv "
    "(24,053 rows / 23,880 after preview filter).</i>", SMALL))

doc = SimpleDocTemplate(
    OUT, pagesize=letter,
    leftMargin=0.7*inch, rightMargin=0.7*inch,
    topMargin=0.7*inch, bottomMargin=0.7*inch,
    title="Sidekick-mini usage analysis 2026-04-23",
    author="laurence.holt@gmail.com",
)
doc.build(story)
print(f"Wrote {OUT}")
