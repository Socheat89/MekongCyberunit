total_slices = 20
friends = 6

slices_per_person = total_slices // friends
leftover_slices = total_slices % friends

print("Slices each:", slices_per_person)
print("Leftover slices:", leftover_slices)