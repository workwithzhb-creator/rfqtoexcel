# RFQ / PR PDF → Excel SaaS (MVP)

## GOAL

Convert ANY construction-related PDF into a clean Excel file with:

- Description
- Size
- Quantity
- UOM

The system must behave like ChatGPT:

- Understands meaning, not rows
- Can merge content across multiple lines/pages
- Can handle messy, non-standard PDFs
- One logical item may be split across 3–4 PDF rows

## STRICT RULES

- AI decides WHAT is an item
- Backend must NEVER split or merge AI items
- Backend must NEVER infer missing data
- Review table is mandatory
- Excel is generated ONLY from reviewed data

## IMPLEMENTATION FLOW

1. Read PDF → extract raw text (no cleaning)
2. Call LLM using:
   - `system_prompt.txt`
   - `item_extraction_prompt.txt`
3. Call LLM again using:
   - `second_pass_prompt.txt`
4. Merge AI results (no dedup logic that splits meaning)
5. Call LLM using:
   - `size_refinement_prompt.txt`
6. Apply normalization rules from:
   - `quantity_rules.txt`
   - `uom_rules.txt`
   - `description_rules.txt`
   - `size_rules.txt`
7. Render review table (per `review_table_rules.txt`)
8. Export Excel (per `excel_export_rules.txt`)

## PROHIBITED

- Anchor-row logic
- Row-based parsing
- Template-based extraction
- Guessing quantity/UOM/size
- Skipping review table
- Adding extra columns to Excel

## DEFINITION OF DONE

- Handles messy RFQs, PRs, BOQs
- Handles items split across multiple lines
- User reviews 30–40 items in < 1 minute
- Excel contains only 4 columns
