# Bend Allowance Implementation

## Overview
Implementacja bend allowance pozwala na uwzględnienie rozciągania i ściskania materiału podczas gięcia w obliczeniach wymiarów.

## Dodane funkcjonalności

### 1. Material Properties
Do interfejsu `Material` dodano:
- `thicknessInches: number` - rzeczywista grubość materiału w calach
- `kFactor: number` - współczynnik K dla obliczeń bend allowance

### 2. Wartości dla materiałów

| Material | Thickness | K-Factor |
|----------|-----------|----------|
| 16 oz Copper | 0.0216" | 0.40 |
| 0.032" Aluminum | 0.032" | 0.33 |
| 24 GA Steel | 0.0276" | 0.44 |

### 3. Funkcje obliczeniowe

#### `calculateBendAllowance()`
Oblicza wymiary dla gięcia:
- **neutralAxisLength** - długość wzdłuż osi neutralnej
- **innerLength** - długość po stronie ściskanej (kompresja)
- **outerLength** - długość po stronie rozciąganej (tension)
- **bendAllowance** - wartość bend allowance

Formuła: `BA = θ × (R + K × T)`
- θ - kąt w radianach
- R - promień wewnętrzny
- K - K-factor
- T - grubość materiału

#### `calculateFlatPatternLength()`
Oblicza całkowitą długość rozwinięcia uwzględniającą wszystkie gięcia.

### 4. Wyświetlanie w DimensionCanvas

Gdy materiał jest wybrany i istnieje gięcie między segmentami, wyświetlane są trzy wymiary:

- **↓ (czerwony)** - długość po stronie ściskanej (inner/compression)
- **⊙ (czarny)** - długość wzdłuż osi neutralnej (neutral axis)
- **↑ (niebieski)** - długość po stronie rozciąganej (outer/tension)

### 5. Edycja właściwości materiału

W MaterialSelector dodano możliwość edycji:
1. Kliknij przycisk ✏️ obok właściwości materiału
2. Edytuj thickness (in inches) i K-Factor
3. Zatwierdź ✓ lub anuluj ✕

## Przykład użycia

1. Wybierz produkt
2. Wybierz materiał (np. 16 oz Copper)
3. Narysuj profil z gięciami
4. Obserwuj trzy wymiary dla każdego segmentu przed gięciem:
   - Wymiar dla strony wewnętrznej (kompresja)
   - Wymiar dla osi neutralnej (referencja)
   - Wymiar dla strony zewnętrznej (rozciąganie)

## Wykorzystanie w sumie wymiarów

Suma wymiarów w PriceDisplay automatycznie uwzględnia bend allowance używając długości wzdłuż osi neutralnej, która jest najbardziej dokładną reprezentacją rzeczywistej długości materiału po gięciu.
